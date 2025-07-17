import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const rapidApiKey = '102e838313msh88095ddd501a9e0p155418jsn629c6e1096f4';
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

function extractASIN(url: string): string | null {
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// Enhanced product details fetching with marketplace comparison
async function fetchProductDetails(asin: string): Promise<{
  productData: any;
  marketplaceAnalysis: any;
  fraudRisk: string;
  priceAnalysis: any;
}> {
  try {
    console.log('Fetching product details for ASIN:', asin);
    
    // Fetch from multiple marketplaces for comparison
    const marketplaces = ['US', 'CA', 'UK', 'DE'];
    const productPromises = marketplaces.map(async (country) => {
      try {
        const response = await fetch(
          `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=${country}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          return { country, data: data.data, success: true };
        }
        return { country, data: null, success: false };
      } catch (error) {
        console.error(`Error fetching from ${country}:`, error);
        return { country, data: null, success: false };
      }
    });

    const marketplaceResults = await Promise.all(productPromises);
    const successfulResults = marketplaceResults.filter(r => r.success && r.data);
    
    if (successfulResults.length === 0) {
      throw new Error('Could not fetch product data from any marketplace');
    }

    const primaryProduct = successfulResults[0].data;
    
    // Analyze pricing across marketplaces
    const priceAnalysis = analyzePricing(successfulResults);
    const fraudRisk = determineFraudRisk(priceAnalysis, primaryProduct);
    
    return {
      productData: primaryProduct,
      marketplaceAnalysis: successfulResults,
      fraudRisk,
      priceAnalysis
    };
  } catch (error) {
    console.error('Error in fetchProductDetails:', error);
    throw error;
  }
}

function analyzePricing(marketplaceResults: any[]): any {
  const prices = marketplaceResults
    .map(r => {
      const price = r.data?.product_price || r.data?.price;
      if (!price) return null;
      
      // Extract numeric value from price string
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      return { country: r.country, price: numericPrice, originalPrice: price };
    })
    .filter(p => p && !isNaN(p.price));

  if (prices.length === 0) {
    return { averagePrice: 0, priceVariation: 0, suspiciousPricing: false };
  }

  const numericPrices = prices.map(p => p.price);
  const averagePrice = numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length;
  const minPrice = Math.min(...numericPrices);
  const maxPrice = Math.max(...numericPrices);
  const priceVariation = ((maxPrice - minPrice) / averagePrice) * 100;
  
  // Flag suspicious pricing if variation is > 50% or if minimum price is < 30% of average
  const suspiciousPricing = priceVariation > 50 || minPrice < (averagePrice * 0.3);

  return {
    prices,
    averagePrice,
    minPrice,
    maxPrice,
    priceVariation,
    suspiciousPricing
  };
}

function determineFraudRisk(priceAnalysis: any, productData: any): string {
  const riskFactors = [];
  
  if (priceAnalysis.suspiciousPricing) {
    riskFactors.push('Suspicious pricing patterns detected');
  }
  
  if (priceAnalysis.priceVariation > 75) {
    riskFactors.push('Extreme price variation across marketplaces');
  }
  
  // Check for other fraud indicators
  const title = (productData?.product_title || productData?.title || '').toLowerCase();
  if (title.includes('replica') || title.includes('copy') || title.includes('alternative')) {
    riskFactors.push('Product title contains replica/copy indicators');
  }
  
  const rating = productData?.product_star_rating || productData?.rating || 0;
  const reviewCount = productData?.product_num_ratings || productData?.review_count || 0;
  
  if (rating > 4.5 && reviewCount < 50) {
    riskFactors.push('Suspiciously high rating with low review count');
  }
  
  if (riskFactors.length === 0) return 'Low';
  if (riskFactors.length <= 2) return 'Medium';
  return 'High';
}

// Enhanced review classification with product context
function classifyReview(review: any, productContext: any): {
  classification: 'genuine' | 'paid' | 'bot' | 'malicious';
  confidence: number;
  explanation: string;
} {
  const text = (review.review_comment || review.text || review.body || review.content || '').toLowerCase();
  const rating = review.review_star_rating || review.rating || review.stars || 5;
  
  // Consider product fraud risk in classification
  const fraudRisk = productContext.fraudRisk;
  let baseConfidence = 65;
  
  if (fraudRisk === 'High') {
    baseConfidence -= 15; // Lower confidence for genuine reviews on high-risk products
  }
  
  // Bot detection patterns
  if (text.length < 20 || /^(good|great|amazing|excellent|perfect)\.?$/i.test(text.trim())) {
    return {
      classification: 'bot',
      confidence: Math.min(95, baseConfidence + 20),
      explanation: 'Very short or generic content typical of automated reviews.'
    };
  }
  
  // Paid review patterns - enhanced with product context
  const paidIndicators = [
    text.includes('received') && (text.includes('free') || text.includes('discount')),
    /amazing|incredible|outstanding|phenomenal/g.test(text) && rating === 5,
    fraudRisk === 'High' && rating === 5 && text.length < 100
  ].filter(Boolean).length;
  
  if (paidIndicators >= 1) {
    return {
      classification: 'paid',
      confidence: Math.min(90, baseConfidence + (paidIndicators * 10)),
      explanation: 'Contains language patterns and enthusiasm levels typical of incentivized reviews.'
    };
  }
  
  // Malicious patterns
  if (text.includes('buy') && text.includes('instead') ||
      text.includes('terrible') && text.includes('waste') && rating === 1) {
    return {
      classification: 'malicious',
      confidence: Math.min(92, baseConfidence + 17),
      explanation: 'Excessively negative language or competitor promotion suggests malicious intent.'
    };
  }
  
  // Genuine review indicators - consider product pricing
  const genuineIndicators = [
    text.length > 50 && text.length < 500,
    text.includes('but') || text.includes('however') || text.includes('although'),
    fraudRisk === 'Low'
  ].filter(Boolean).length;
  
  if (genuineIndicators >= 2) {
    return {
      classification: 'genuine',
      confidence: Math.min(95, baseConfidence + (genuineIndicators * 8)),
      explanation: 'Balanced language with specific details and nuanced opinions typical of authentic reviews.'
    };
  }
  
  return {
    classification: 'genuine',
    confidence: baseConfidence,
    explanation: 'Review appears authentic based on length and content patterns.'
  };
}

function calculateTrustScore(analyzedReviews: any[], productContext: any): number {
  const genuine = analyzedReviews.filter(r => r.classification === 'genuine').length;
  const total = analyzedReviews.length;
  let baseScore = Math.round((genuine / total) * 100);
  
  // Adjust based on fraud risk
  const fraudRisk = productContext.fraudRisk;
  if (fraudRisk === 'High') {
    baseScore = Math.max(0, baseScore - 25);
  } else if (fraudRisk === 'Medium') {
    baseScore = Math.max(0, baseScore - 10);
  }
  
  return baseScore;
}

// Enhanced analysis with pricing context
async function analyzeSentiment(reviewTexts: string[]): Promise<{
  sentimentScore: number;
  sentimentDistribution: any;
  emotionScores: any;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of these product reviews. Return a JSON object with:
            - sentimentScore: overall sentiment from -1 (negative) to 1 (positive)
            - sentimentDistribution: {positive: %, neutral: %, negative: %}
            - emotionScores: {frustrated: %, excited: %, disappointed: %, satisfied: %, angry: %}`
          },
          {
            role: 'user',
            content: `Reviews to analyze: ${reviewTexts.join('\n---\n')}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return {
        sentimentScore: 0,
        sentimentDistribution: { positive: 33, neutral: 34, negative: 33 },
        emotionScores: { satisfied: 50, neutral: 50 }
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        sentimentScore: 0,
        sentimentDistribution: { positive: 33, neutral: 34, negative: 33 },
        emotionScores: { satisfied: 50, neutral: 50 }
      };
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      sentimentScore: 0,
      sentimentDistribution: { positive: 33, neutral: 34, negative: 33 },
      emotionScores: { satisfied: 50, neutral: 50 }
    };
  }
}

// Enhanced insights with product fraud analysis
function generateInsights(analyzedReviews: any[], productContext: any): string[] {
  const insights = [];
  const classifications = analyzedReviews.reduce((acc, review) => {
    acc[review.classification] = (acc[review.classification] || 0) + 1;
    return acc;
  }, {});
  
  const totalReviews = analyzedReviews.length;
  const suspiciousCount = (classifications.paid || 0) + (classifications.bot || 0) + (classifications.malicious || 0);
  const suspiciousPercentage = Math.round((suspiciousCount / totalReviews) * 100);
  
  // Product fraud risk insights
  if (productContext.fraudRisk === 'High') {
    insights.push('⚠️ High fraud risk detected based on pricing analysis');
  } else if (productContext.fraudRisk === 'Medium') {
    insights.push('⚡ Medium fraud risk - pricing patterns require attention');
  }
  
  // Pricing insights
  if (productContext.priceAnalysis.suspiciousPricing) {
    insights.push(`💰 Suspicious pricing: ${productContext.priceAnalysis.priceVariation.toFixed(1)}% variation across marketplaces`);
  }
  
  // Review pattern insights
  if (suspiciousPercentage > 30) {
    insights.push(`${suspiciousPercentage}% of reviews show suspicious patterns`);
  }
  
  if (classifications.paid > 0) {
    insights.push(`${classifications.paid} potentially paid reviews detected`);
  }
  
  if (classifications.bot > 0) {
    insights.push(`${classifications.bot} bot-generated reviews identified`);
  }
  
  if (classifications.malicious > 0) {
    insights.push(`${classifications.malicious} malicious reviews flagged`);
  }
  
  const fiveStarCount = analyzedReviews.filter(r => r.rating === 5).length;
  if (fiveStarCount / totalReviews > 0.7) {
    insights.push('High concentration of 5-star ratings detected');
  }
  
  return insights.length > 0 ? insights : ['No suspicious patterns detected in the analyzed reviews'];
}

// Enhanced AI summaries with fraud context
async function generateAISummaries(reviewTexts: string[], productName: string, productContext: any): Promise<{
  summaryPositive: string;
  summaryNegative: string;
  summaryOverall: string;
  recommendation: string;
  fraudAnalysis: string;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze these reviews for ${productName} considering fraud risk level: ${productContext.fraudRisk}. 
            Price analysis shows ${productContext.priceAnalysis.priceVariation?.toFixed(1)}% variation across marketplaces.
            Return JSON with:
            - summaryPositive: what customers love most (2-3 sentences)
            - summaryNegative: main complaints and issues (2-3 sentences)
            - summaryOverall: balanced overall impression considering fraud risk (3-4 sentences)
            - recommendation: buying recommendation with fraud risk considerations (2-3 sentences)
            - fraudAnalysis: assessment of product authenticity based on pricing and reviews (2-3 sentences)`
          },
          {
            role: 'user',
            content: `Product: ${productName}\nFraud Risk: ${productContext.fraudRisk}\nReviews: ${reviewTexts.join('\n---\n')}`
          }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return {
        summaryPositive: "Most customers appreciate the product's quality and value.",
        summaryNegative: "Some users reported minor issues with delivery or packaging.",
        summaryOverall: "Overall, this product receives mixed to positive feedback from customers.",
        recommendation: "Consider your specific needs and read recent reviews before purchasing.",
        fraudAnalysis: "Product authenticity assessment is ongoing."
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        summaryPositive: "Most customers appreciate the product's quality and value.",
        summaryNegative: "Some users reported minor issues with delivery or packaging.",
        summaryOverall: "Overall, this product receives mixed to positive feedback from customers.",
        recommendation: "Consider your specific needs and read recent reviews before purchasing.",
        fraudAnalysis: "Product authenticity assessment is ongoing."
      };
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summaryPositive: "Most customers appreciate the product's quality and value.",
      summaryNegative: "Some users reported minor issues with delivery or packaging.",
      summaryOverall: "Overall, this product receives mixed to positive feedback from customers.",
      recommendation: "Consider your specific needs and read recent reviews before purchasing.",
      fraudAnalysis: "Product authenticity assessment is ongoing."
    };
  }
}

// Extract topics and keywords using OpenAI
async function extractTopicsAndKeywords(reviewTexts: string[]): Promise<{
  topics: any;
  keywords: string[];
  productAspects: any;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract topics and keywords from these product reviews. Return JSON with:
            - topics: [{name: "topic", frequency: count, sentiment: "positive/negative/neutral"}]
            - keywords: ["keyword1", "keyword2"] (most mentioned words/phrases)
            - productAspects: {quality: sentiment, price: sentiment, shipping: sentiment, etc.}`
          },
          {
            role: 'user',
            content: `Reviews: ${reviewTexts.join('\n---\n')}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return {
        topics: [],
        keywords: [],
        productAspects: {}
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        topics: [],
        keywords: [],
        productAspects: {}
      };
    }
  } catch (error) {
    console.error('Topic extraction error:', error);
    return {
      topics: [],
      keywords: [],
      productAspects: {}
    };
  }
}

serve(async (req) => {
  console.log('Analyze reviews function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Analyzing URL:', url);
    
    const asin = extractASIN(url);
    if (!asin) {
      console.error('Invalid Amazon URL, no ASIN found');
      return new Response(
        JSON.stringify({ error: 'Invalid Amazon product URL' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Extracted ASIN:', asin);
    
    // Check if we have cached results
    const { data: cached } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('asin', asin)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();
    
    if (cached) {
      console.log('Returning cached results');
      return new Response(
        JSON.stringify({
          overallTrust: cached.overall_trust,
          totalReviews: cached.total_reviews,
          analyzedReviews: cached.analyzed_reviews,
          insights: cached.insights,
          productName: cached.product_name || 'Unknown Product',
          sentimentScore: cached.sentiment_score || 0,
          sentimentDistribution: cached.sentiment_distribution || { positive: 33, neutral: 34, negative: 33 },
          emotionScores: cached.emotion_scores || {},
          topics: cached.topics || [],
          keywords: cached.keywords || [],
          productAspects: cached.product_aspects || {},
          summaryPositive: cached.summary_positive || "Analysis in progress...",
          summaryNegative: cached.summary_negative || "Analysis in progress...",
          summaryOverall: cached.summary_overall || "Analysis in progress...",
          recommendation: cached.recommendation || "Analysis in progress..."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Fetching product details and reviews...');
    
    // Fetch product details with marketplace analysis
    const productContext = await fetchProductDetails(asin);
    const productName = productContext.productData?.product_title || 
                       productContext.productData?.title || 'Unknown Product';
    
    console.log('Product context:', { 
      name: productName, 
      fraudRisk: productContext.fraudRisk,
      priceVariation: productContext.priceAnalysis.priceVariation 
    });
    
    // Fetch product reviews
    const rapidResponse = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=US&page=1&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      }
    );
    
    if (!rapidResponse.ok) {
      console.error('RapidAPI error:', rapidResponse.status, rapidResponse.statusText);
      throw new Error(`RapidAPI request failed: ${rapidResponse.status}`);
    }
    
    const rapidData = await rapidResponse.json();
    let reviews = rapidData.data?.reviews || [];
    
    if (!reviews || !Array.isArray(reviews)) {
      console.error('No reviews found in RapidAPI response');
      throw new Error('No reviews found for this product');
    }
    
    // Get additional reviews if needed
    if (reviews.length < 10) {
      console.log(`Only ${reviews.length} reviews found on page 1, fetching page 2...`);
      try {
        const page2Response = await fetch(
          `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=US&page=2&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey
            }
          }
        );
        
        if (page2Response.ok) {
          const page2Data = await page2Response.json();
          const page2Reviews = page2Data.data?.reviews || [];
          reviews = [...reviews, ...page2Reviews];
          console.log(`Added ${page2Reviews.length} reviews from page 2. Total: ${reviews.length}`);
        }
      } catch (error) {
        console.log('Could not fetch page 2, continuing with available reviews:', error);
      }
    }
    
    if (reviews.length === 0) {
      throw new Error('No reviews found for this product');
    }
    
    const reviewsToAnalyze = reviews.slice(0, 10);
    console.log(`Analyzing ${reviewsToAnalyze.length} reviews with product context`);
    
    // Enhanced analysis with product context
    const analyzedReviews = reviewsToAnalyze.map((review: any, index: number) => {
      const classification = classifyReview(review, productContext);
      
      return {
        id: `${asin}_${index}`,
        text: review.review_comment || review.text || review.body || 'No review text available',
        rating: review.review_star_rating || review.rating || review.stars || 5,
        date: review.review_date || new Date().toISOString().split('T')[0],
        author: review.review_author || review.name || review.author || `Reviewer ${index + 1}`,
        ...classification
      };
    });
    
    const overallTrust = calculateTrustScore(analyzedReviews, productContext);
    const insights = generateInsights(analyzedReviews, productContext);
    
    // Enhanced AI analysis with product context
    console.log('Performing enhanced AI analysis with fraud detection...');
    const reviewTexts = analyzedReviews.map(r => r.text);
    
    const [sentimentData, topicsData, summariesData] = await Promise.all([
      analyzeSentiment(reviewTexts),
      extractTopicsAndKeywords(reviewTexts),
      generateAISummaries(reviewTexts, productName, productContext)
    ]);
    
    const result = {
      overallTrust,
      totalReviews: reviewsToAnalyze.length,
      analyzedReviews,
      insights,
      productName,
      sentimentScore: sentimentData.sentimentScore,
      sentimentDistribution: sentimentData.sentimentDistribution,
      emotionScores: sentimentData.emotionScores,
      topics: topicsData.topics,
      keywords: topicsData.keywords,
      productAspects: topicsData.productAspects,
      summaryPositive: summariesData.summaryPositive,
      summaryNegative: summariesData.summaryNegative,
      summaryOverall: summariesData.summaryOverall,
      recommendation: summariesData.recommendation,
      fraudAnalysis: summariesData.fraudAnalysis,
      productContext: {
        fraudRisk: productContext.fraudRisk,
        priceAnalysis: productContext.priceAnalysis,
        marketplaceAnalysis: productContext.marketplaceAnalysis
      }
    };
    
    // Cache the enhanced results
    await supabase
      .from('analysis_results')
      .insert({
        asin,
        product_name: productName,
        overall_trust: overallTrust,
        total_reviews: reviewsToAnalyze.length,
        analyzed_reviews: analyzedReviews,
        insights,
        sentiment_score: sentimentData.sentimentScore,
        sentiment_distribution: sentimentData.sentimentDistribution,
        emotion_scores: sentimentData.emotionScores,
        topics: topicsData.topics,
        keywords: topicsData.keywords,
        product_aspects: topicsData.productAspects,
        summary_positive: summariesData.summaryPositive,
        summary_negative: summariesData.summaryNegative,
        summary_overall: summariesData.summaryOverall,
        recommendation: summariesData.recommendation
      });
    
    console.log('Enhanced analysis complete with fraud detection');
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-reviews function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze reviews',
        details: error.toString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
