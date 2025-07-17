
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY') ?? '';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to fetch product details
async function fetchProductDetails(asin: string) {
  try {
    console.log(`Fetching product details for ASIN: ${asin}`);
    
    const productResponse = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!productResponse.ok) {
      console.error(`Product details API failed: ${productResponse.status} - ${productResponse.statusText}`);
      return null;
    }

    const productData = await productResponse.json();
    console.log('Product details API response:', JSON.stringify(productData, null, 2));

    return productData;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

// Function to analyze pricing data
function analyzePricing(productData: any) {
  if (!productData?.data) {
    return {
      prices: [],
      averagePrice: 0,
      priceVariation: 0,
      suspiciousPricing: false,
      marketplacesChecked: 0,
      crossMarketplaceAnalysis: false
    };
  }

  const product = productData.data;
  const prices = [];
  
  // Extract current price
  const currentPrice = product.product_price || product.price || product.current_price;
  const originalPrice = product.product_original_price || product.original_price || product.list_price;
  
  if (currentPrice) {
    // Parse price string to number (remove currency symbols)
    const priceValue = parseFloat(currentPrice.toString().replace(/[^0-9.]/g, ''));
    const originalPriceValue = originalPrice ? parseFloat(originalPrice.toString().replace(/[^0-9.]/g, '')) : priceValue;
    
    prices.push({
      country: 'Amazon US',
      price: priceValue,
      originalPrice: currentPrice.toString(),
      marketplace: 'amazon'
    });

    // Calculate price analysis
    const averagePrice = priceValue;
    const priceVariation = originalPriceValue > priceValue ? 
      ((originalPriceValue - priceValue) / originalPriceValue) * 100 : 0;
    
    // Detect suspicious pricing (more than 70% off or extremely low prices)
    const suspiciousPricing = priceVariation > 70 || priceValue < 5;

    return {
      prices,
      averagePrice,
      priceVariation,
      suspiciousPricing,
      marketplacesChecked: 1,
      crossMarketplaceAnalysis: false
    };
  }

  return {
    prices: [],
    averagePrice: 0,
    priceVariation: 0,
    suspiciousPricing: false,
    marketplacesChecked: 0,
    crossMarketplaceAnalysis: false
  };
}

// Function to extract product information
function extractProductInfo(productData: any) {
  if (!productData?.data) {
    return {
      productName: "Amazon Product",
      category: "Unknown",
      brand: "Unknown",
      availability: "Unknown"
    };
  }

  const product = productData.data;
  
  return {
    productName: product.product_title || product.title || product.product_name || "Amazon Product",
    category: product.product_category || product.category || "Unknown",
    brand: product.brand || product.product_brand || "Unknown",
    availability: product.product_availability || product.availability || "Unknown",
    images: product.product_photos || product.images || [],
    rating: product.product_star_rating || product.rating || null,
    totalRatings: product.product_num_ratings || product.total_ratings || null
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'RapidAPI key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing URL:', url);

    // Extract ASIN from Amazon URL
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    const asin = asinMatch ? (asinMatch[1] || asinMatch[2]) : null;

    if (!asin) {
      return new Response(JSON.stringify({ error: 'Invalid Amazon URL - could not extract ASIN' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Extracted ASIN:', asin);

    // Fetch both product details and reviews simultaneously
    const [productDetailsData, reviewsResult] = await Promise.allSettled([
      fetchProductDetails(asin),
      fetchReviews(asin)
    ]);

    // Extract product information
    const productData = productDetailsData.status === 'fulfilled' ? productDetailsData.value : null;
    const productInfo = extractProductInfo(productData);
    const priceAnalysis = analyzePricing(productData);

    // Handle reviews result
    const realReviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [];

    console.log(`Successfully fetched product details and ${realReviews.length} reviews`);

    // Handle case where no reviews are available (e.g., pre-order products)
    if (realReviews.length === 0) {
      console.log('No reviews found - handling as pre-order or new product');
      
      // Create a special response for products with no reviews
      const result = {
        asin,
        productName: productInfo.productName,
        totalReviews: 0,
        overallTrust: 0, // Cannot assess trust without reviews
        analyzedReviews: [],
        sentimentScore: 0,
        sentimentDistribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        emotionScores: {
          joy: 0,
          anger: 0,
          surprise: 0,
          sadness: 0
        },
        insights: [
          'No reviews available for analysis',
          'This appears to be a new or pre-order product',
          `Product availability: ${productInfo.availability}`,
          `Current price: $${priceAnalysis.averagePrice > 0 ? priceAnalysis.averagePrice.toFixed(2) : 'Not available'}`,
          'Cannot assess review authenticity without reviews',
          'Consider checking back after product release for review analysis'
        ],
        topics: [],
        keywords: [],
        productAspects: {
          category: productInfo.category,
          brand: productInfo.brand,
          availability: productInfo.availability
        },
        summaryOverall: `This ${productInfo.productName} currently has no customer reviews available. This is typical for pre-order or newly launched products.`,
        summaryPositive: "No positive reviews to analyze yet.",
        summaryNegative: "No negative reviews to analyze yet.",
        recommendation: productInfo.availability.toLowerCase().includes('pre-order') || productInfo.availability.toLowerCase().includes('release') ?
          `This is a pre-order item (${productInfo.availability}). Consider waiting for customer reviews after release to make an informed decision.` :
          `This product has no reviews yet. As a new item, consider researching similar products or waiting for initial customer feedback.`,
        productContext: {
          fraudRisk: 'High' as const, // High risk due to no reviews and limited marketplace data
          priceAnalysis,
          marketplaceAnalysis: [
            { 
              country: 'Amazon US',
              data: { 
                name: 'Amazon', 
                trustScore: 0, 
                reviewCount: 0, 
                averageRating: 0,
                price: priceAnalysis.averagePrice,
                availability: productInfo.availability
              },
              success: true,
              marketplace: 'amazon'
            }
          ]
        }
      };

      // Store in database
      const { error: dbError } = await supabaseClient
        .from('analysis_results')
        .insert({
          asin,
          product_name: result.productName,
          total_reviews: 0,
          overall_trust: 0,
          analyzed_reviews: [],
          sentiment_score: 0,
          sentiment_distribution: result.sentimentDistribution,
          emotion_scores: result.emotionScores,
          insights: result.insights,
          summary_overall: result.summaryOverall,
          summary_positive: result.summaryPositive,
          summary_negative: result.summaryNegative,
          recommendation: result.recommendation
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Continue with normal analysis if reviews are available
    const analyzedReviews = realReviews.map(review => {
      // Enhanced classification logic based on real review patterns
      let classification: 'genuine' | 'paid' | 'bot' | 'malicious';
      let confidence = 85;
      let explanation = '';

      const text = review.text.toLowerCase();
      const textLength = review.text.length;

      // Bot detection - very short reviews, unverified, repetitive language
      if (!review.verified && textLength < 30) {
        classification = 'bot';
        explanation = 'Unverified purchase with suspiciously short review text';
        confidence = 92;
      } 
      // Paid review detection - promotional language, excessive enthusiasm
      else if (
        text.includes('best product ever') || 
        text.includes('buy now') || 
        text.includes('highly recommend') && text.includes('amazing') ||
        text.includes('perfect product') ||
        (review.rating === 5 && textLength < 50)
      ) {
        classification = 'paid';
        explanation = 'Contains promotional language or patterns typical of incentivized reviews';
        confidence = 88;
      }
      // Malicious review detection - extremely negative, competitor-like language
      else if (
        review.rating === 1 && 
        (text.includes('waste of money') || text.includes('scam') || text.includes('fake'))
      ) {
        classification = 'malicious';
        explanation = 'Extremely negative language that may indicate competitor interference';
        confidence = 75;
      }
      // Genuine review - natural language, balanced content, verified purchase
      else {
        classification = 'genuine';
        explanation = 'Natural language patterns and purchase verification indicate authentic review';
        confidence = 90;
      }

      // Enhanced sentiment analysis
      let sentimentScore = 0;
      const rating = review.rating;
      
      // Base sentiment from rating
      if (rating >= 4) {
        sentimentScore = 0.6 + (rating - 4) * 0.4;
      } else if (rating <= 2) {
        sentimentScore = -0.6 - (2 - rating) * 0.4;
      } else {
        sentimentScore = (rating - 3) * 0.3;
      }

      // Keyword-based sentiment adjustment
      const positiveWords = ['amazing', 'excellent', 'great', 'perfect', 'love', 'fantastic', 'wonderful', 'outstanding', 'superb', 'brilliant'];
      const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'useless', 'broken', 'waste', 'defective'];
      const neutralWords = ['okay', 'decent', 'average', 'fine', 'acceptable', 'adequate'];

      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore += 0.1;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore -= 0.1;
      });
      neutralWords.forEach(word => {
        if (text.includes(word)) sentimentScore *= 0.8;
      });

      // Clamp sentiment score
      sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
      
      let sentiment: string;
      if (sentimentScore > 0.2) sentiment = 'positive';
      else if (sentimentScore < -0.2) sentiment = 'negative';
      else sentiment = 'neutral';

      // Calculate emotion scores
      const emotionScores = {
        joy: Math.max(0.1, Math.min(0.9, 
          (text.includes('happy') || text.includes('love') || text.includes('amazing') || text.includes('perfect')) ? 0.8 : 0.2
        )),
        anger: Math.max(0.1, Math.min(0.9,
          (text.includes('angry') || text.includes('terrible') || text.includes('hate') || text.includes('awful')) ? 0.8 : 0.2
        )),
        surprise: Math.max(0.1, Math.min(0.9,
          (text.includes('unexpected') || text.includes('surprised') || text.includes('wow') || text.includes('exceeded')) ? 0.7 : 0.2
        )),
        sadness: Math.max(0.1, Math.min(0.9,
          (text.includes('disappointed') || text.includes('sad') || text.includes('waste') || text.includes('broken')) ? 0.7 : 0.2
        ))
      };

      return {
        ...review,
        classification,
        confidence,
        explanation,
        sentimentScore,
        sentiment,
        emotionScores
      };
    });

    const totalReviews = analyzedReviews.length;
    const avgSentiment = analyzedReviews.reduce((sum, r) => sum + r.sentimentScore, 0) / totalReviews;
    
    const positiveCount = analyzedReviews.filter(r => r.sentiment === 'positive').length;
    const neutralCount = analyzedReviews.filter(r => r.sentiment === 'neutral').length;
    const negativeCount = analyzedReviews.filter(r => r.sentiment === 'negative').length;

    const sentimentDistribution = {
      positive: Math.round((positiveCount / totalReviews) * 100),
      neutral: Math.round((neutralCount / totalReviews) * 100),
      negative: Math.round((negativeCount / totalReviews) * 100)
    };

    // Calculate aggregated emotion scores
    const emotionScores = {
      joy: analyzedReviews.reduce((sum, r) => sum + r.emotionScores.joy, 0) / totalReviews,
      anger: analyzedReviews.reduce((sum, r) => sum + r.emotionScores.anger, 0) / totalReviews,
      surprise: analyzedReviews.reduce((sum, r) => sum + r.emotionScores.surprise, 0) / totalReviews,
      sadness: analyzedReviews.reduce((sum, r) => sum + r.emotionScores.sadness, 0) / totalReviews
    };

    // Calculate trust score based on genuine reviews
    const genuineCount = analyzedReviews.filter(r => r.classification === 'genuine').length;
    const overallTrust = Math.round((genuineCount / totalReviews) * 100);

    // Generate insights with product-specific information
    const botCount = analyzedReviews.filter(r => r.classification === 'bot').length;
    const paidCount = analyzedReviews.filter(r => r.classification === 'paid').length;
    const maliciousCount = analyzedReviews.filter(r => r.classification === 'malicious').length;
    
    const insights = [
      `${Math.round((genuineCount / totalReviews) * 100)}% of reviews appear genuine`,
      `${sentimentDistribution.positive}% positive sentiment detected`,
      `Average sentiment score: ${avgSentiment.toFixed(2)}`,
      `${botCount} potential bot reviews identified`,
      `${paidCount} likely paid reviews detected`,
      `${maliciousCount} potentially malicious reviews found`,
      `Product price: $${priceAnalysis.averagePrice.toFixed(2)}`,
      `Price variation: ${priceAnalysis.priceVariation.toFixed(1)}%`
    ];

    // Enhanced marketplace analysis with real data
    const marketplaceAnalysis = [
      { 
        country: 'Amazon US',
        data: { 
          name: 'Amazon', 
          trustScore: overallTrust, 
          reviewCount: totalReviews, 
          averageRating: analyzedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews,
          price: priceAnalysis.averagePrice,
          availability: productInfo.availability
        },
        success: true,
        marketplace: 'amazon'
      }
    ];

    // Determine fraud risk based on multiple factors
    let fraudRisk: 'Low' | 'Medium' | 'High' = 'Low';
    if (overallTrust < 50 || priceAnalysis.suspiciousPricing) {
      fraudRisk = 'High';
    } else if (overallTrust < 70 || paidCount > totalReviews * 0.3) {
      fraudRisk = 'Medium';
    }

    // Update fraud risk to High if less than 3 marketplaces checked
    if (priceAnalysis.marketplacesChecked < 3) {
      fraudRisk = 'High';
    }

    const result = {
      asin,
      productName: productInfo.productName,
      totalReviews,
      overallTrust,
      analyzedReviews,
      sentimentScore: avgSentiment,
      sentimentDistribution,
      emotionScores,
      insights,
      topics: [], // Would require NLP processing
      keywords: [], // Would require NLP processing
      productAspects: {
        category: productInfo.category,
        brand: productInfo.brand,
        availability: productInfo.availability
      },
      summaryOverall: `Analysis of ${totalReviews} real Amazon reviews for ${productInfo.productName} shows ${overallTrust}% appear genuine. Current price: $${priceAnalysis.averagePrice.toFixed(2)}.`,
      summaryPositive: positiveCount > 0 ? "Customers appreciate product quality and performance based on verified reviews." : "Limited positive feedback detected.",
      summaryNegative: negativeCount > 0 ? "Some customers report issues with quality or expectations not being met." : "Few negative concerns identified.",
      recommendation: overallTrust > 70 && priceAnalysis.marketplacesChecked >= 3 ? 
        `Product appears to have genuine positive reviews at $${priceAnalysis.averagePrice.toFixed(2)}. Consider individual review details before purchasing.` :
        `Exercise caution - ${priceAnalysis.marketplacesChecked < 3 ? 'insufficient marketplace coverage and ' : ''}suspicious review activity detected. Read individual reviews carefully.`,
      productContext: {
        fraudRisk,
        priceAnalysis,
        marketplaceAnalysis
      }
    };

    // Store in database
    const { error: dbError } = await supabaseClient
      .from('analysis_results')
      .insert({
        asin,
        product_name: result.productName,
        total_reviews: totalReviews,
        overall_trust: overallTrust,
        analyzed_reviews: analyzedReviews,
        sentiment_score: avgSentiment,
        sentiment_distribution: sentimentDistribution,
        emotion_scores: emotionScores,
        insights,
        summary_overall: result.summaryOverall,
        summary_positive: result.summaryPositive,
        summary_negative: result.summaryNegative,
        recommendation: result.recommendation
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-reviews function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to fetch reviews (extracted from existing code)
async function fetchReviews(asin: string) {
  let realReviews = [];
  
  // Try to fetch from multiple pages to get at least 10 reviews
  for (let page = 1; page <= 3 && realReviews.length < 10; page++) {
    try {
      console.log(`Fetching page ${page} of reviews for ASIN: ${asin}`);
      
      const reviewsResponse = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=US&page=${page}&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
        }
      );

      if (!reviewsResponse.ok) {
        console.error(`API request failed for page ${page}: ${reviewsResponse.status} - ${reviewsResponse.statusText}`);
        continue;
      }

      const reviewsData = await reviewsResponse.json();
      console.log(`Page ${page} API response:`, JSON.stringify(reviewsData, null, 2));

      if (reviewsData.data && reviewsData.data.reviews) {
        const pageReviews = reviewsData.data.reviews.map((review: any, index: number) => ({
          id: `${page}-${index + 1}`,
          text: review.review_comment || review.review_text || review.review_body || 'No review text available',
          rating: review.review_star_rating || review.rating || review.stars || 5,
          date: review.review_date || review.date || new Date().toISOString().split('T')[0],
          author: review.review_author || review.reviewer_name || review.author || 'Anonymous',
          verified: review.is_verified_purchase !== false
        }));
        
        realReviews.push(...pageReviews);
      }
    } catch (pageError) {
      console.error(`Error fetching page ${page}:`, pageError);
      continue;
    }
  }

  // Limit to first 15 reviews for processing
  return realReviews.slice(0, 15);
}
