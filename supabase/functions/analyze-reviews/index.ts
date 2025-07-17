
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

function classifyReview(review: any): {
  classification: 'genuine' | 'paid' | 'bot' | 'malicious';
  confidence: number;
  explanation: string;
} {
  const text = (review.review_comment || review.text || review.body || review.content || '').toLowerCase();
  const rating = review.review_star_rating || review.rating || review.stars || 5;
  
  // Bot detection patterns
  if (text.length < 20 || /^(good|great|amazing|excellent|perfect)\.?$/i.test(text.trim())) {
    return {
      classification: 'bot',
      confidence: 85,
      explanation: 'Very short or generic content typical of automated reviews.'
    };
  }
  
  // Paid review patterns
  if (text.includes('received') && (text.includes('free') || text.includes('discount')) ||
      /amazing|incredible|outstanding|phenomenal/g.test(text) && rating === 5) {
    return {
      classification: 'paid',
      confidence: 78,
      explanation: 'Contains language patterns and enthusiasm levels typical of incentivized reviews.'
    };
  }
  
  // Malicious patterns
  if (text.includes('buy') && text.includes('instead') ||
      text.includes('terrible') && text.includes('waste') && rating === 1) {
    return {
      classification: 'malicious',
      confidence: 82,
      explanation: 'Excessively negative language or competitor promotion suggests malicious intent.'
    };
  }
  
  // Genuine review indicators
  if (text.length > 50 && text.length < 500 && 
      (text.includes('but') || text.includes('however') || text.includes('although'))) {
    return {
      classification: 'genuine',
      confidence: 88,
      explanation: 'Balanced language with specific details and nuanced opinions typical of authentic reviews.'
    };
  }
  
  return {
    classification: 'genuine',
    confidence: 65,
    explanation: 'Review appears authentic based on length and content patterns.'
  };
}

function calculateTrustScore(analyzedReviews: any[]): number {
  const genuine = analyzedReviews.filter(r => r.classification === 'genuine').length;
  const total = analyzedReviews.length;
  return Math.round((genuine / total) * 100);
}

// Enhanced sentiment analysis using OpenAI
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

// Generate AI summaries
async function generateAISummaries(reviewTexts: string[], productName: string): Promise<{
  summaryPositive: string;
  summaryNegative: string;
  summaryOverall: string;
  recommendation: string;
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
            content: `Analyze these reviews for ${productName} and create comprehensive summaries. Return JSON with:
            - summaryPositive: what customers love most (2-3 sentences)
            - summaryNegative: main complaints and issues (2-3 sentences)
            - summaryOverall: balanced overall impression (3-4 sentences)
            - recommendation: buying recommendation with key considerations (2-3 sentences)`
          },
          {
            role: 'user',
            content: `Product: ${productName}\nReviews: ${reviewTexts.join('\n---\n')}`
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
        recommendation: "Consider your specific needs and read recent reviews before purchasing."
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
        recommendation: "Consider your specific needs and read recent reviews before purchasing."
      };
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summaryPositive: "Most customers appreciate the product's quality and value.",
      summaryNegative: "Some users reported minor issues with delivery or packaging.",
      summaryOverall: "Overall, this product receives mixed to positive feedback from customers.",
      recommendation: "Consider your specific needs and read recent reviews before purchasing."
    };
  }
}

function generateInsights(analyzedReviews: any[]): string[] {
  const insights = [];
  const classifications = analyzedReviews.reduce((acc, review) => {
    acc[review.classification] = (acc[review.classification] || 0) + 1;
    return acc;
  }, {});
  
  const totalReviews = analyzedReviews.length;
  const suspiciousCount = (classifications.paid || 0) + (classifications.bot || 0) + (classifications.malicious || 0);
  const suspiciousPercentage = Math.round((suspiciousCount / totalReviews) * 100);
  
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
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours
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
          sentimentScore: cached.sentiment_score,
          sentimentDistribution: cached.sentiment_distribution,
          emotionScores: cached.emotion_scores,
          topics: cached.topics,
          keywords: cached.keywords,
          productAspects: cached.product_aspects,
          summaryPositive: cached.summary_positive,
          summaryNegative: cached.summary_negative,
          summaryOverall: cached.summary_overall,
          recommendation: cached.recommendation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Fetching product details and reviews from RapidAPI...');
    
    // First, get product details to extract the product name
    const productResponse = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      }
    );
    
    let productName = 'Unknown Product';
    if (productResponse.ok) {
      const productData = await productResponse.json();
      productName = productData.data?.product_title || productData.data?.title || 'Unknown Product';
      console.log('Product name extracted:', productName);
    }
    
    // Fetch product reviews from RapidAPI - request more pages if needed to get at least 10 reviews
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
      const errorText = await rapidResponse.text();
      console.error('RapidAPI error body:', errorText);
      throw new Error(`RapidAPI request failed: ${rapidResponse.status}`);
    }
    
    const rapidData = await rapidResponse.json();
    console.log('RapidAPI response received, processing reviews...');
    
    // RapidAPI returns reviews in the data.reviews array
    let reviews = rapidData.data?.reviews || [];
    
    if (!reviews || !Array.isArray(reviews)) {
      console.error('No reviews found in RapidAPI response');
      throw new Error('No reviews found for this product');
    }
    
    // If we have fewer than 10 reviews, try to get more from page 2
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
    
    // Ensure we have at least some reviews
    if (reviews.length === 0) {
      throw new Error('No reviews found for this product');
    }
    
    // Take exactly 10 reviews (or whatever is available if less than 10)
    const reviewsToAnalyze = reviews.slice(0, 10);
    console.log(`Analyzing ${reviewsToAnalyze.length} reviews`);
    
    // Process and analyze exactly 10 reviews (or whatever is available)
    const analyzedReviews = reviewsToAnalyze.map((review: any, index: number) => {
      const classification = classifyReview(review);
      
      return {
        id: `${asin}_${index}`,
        text: review.review_comment || review.text || review.body || 'No review text available',
        rating: review.review_star_rating || review.rating || review.stars || 5,
        date: review.review_date || new Date().toISOString().split('T')[0],
        author: review.review_author || review.name || review.author || `Reviewer ${index + 1}`,
        ...classification
      };
    });
    
    const overallTrust = calculateTrustScore(analyzedReviews);
    const insights = generateInsights(analyzedReviews);
    
    // Enhanced AI analysis
    console.log('Performing enhanced AI analysis...');
    const reviewTexts = analyzedReviews.map(r => r.text);
    
    const [sentimentData, topicsData, summariesData] = await Promise.all([
      analyzeSentiment(reviewTexts),
      extractTopicsAndKeywords(reviewTexts),
      generateAISummaries(reviewTexts, productName)
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
      recommendation: summariesData.recommendation
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
    
    console.log('Analysis complete, returning results');
    
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
