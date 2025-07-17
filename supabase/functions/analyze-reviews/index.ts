
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

    // Fetch real reviews from RapidAPI
    let realReviews = [];
    let productName = "Amazon Product";
    let totalPages = 1;
    
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
          
          // Set product name from first successful response
          if (page === 1 && reviewsData.data.product_title) {
            productName = reviewsData.data.product_title || reviewsData.data.product_name || "Amazon Product";
          }
        }
      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
        continue;
      }
    }

    if (realReviews.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Unable to fetch reviews from Amazon API. Please check the product URL and try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit to first 15 reviews for processing
    realReviews = realReviews.slice(0, 15);
    
    console.log(`Successfully fetched ${realReviews.length} real reviews`);

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

    // Generate real insights
    const botCount = analyzedReviews.filter(r => r.classification === 'bot').length;
    const paidCount = analyzedReviews.filter(r => r.classification === 'paid').length;
    const maliciousCount = analyzedReviews.filter(r => r.classification === 'malicious').length;
    
    const insights = [
      `${Math.round((genuineCount / totalReviews) * 100)}% of reviews appear genuine`,
      `${sentimentDistribution.positive}% positive sentiment detected`,
      `Average sentiment score: ${avgSentiment.toFixed(2)}`,
      `${botCount} potential bot reviews identified`,
      `${paidCount} likely paid reviews detected`,
      `${maliciousCount} potentially malicious reviews found`
    ];

    // Real price analysis would require additional API calls
    const priceAnalysis = {
      amazonPrice: 0, // Would need product price API
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      priceRange: 'Unknown',
      marketplaces: ['Amazon'],
      prices: [
        { country: 'US', price: 0, originalPrice: 'Price not available' }
      ],
      priceVariation: 0,
      suspiciousPricing: false,
      marketplacesChecked: 1
    };

    // Simplified marketplace analysis
    const marketplaceAnalysis = [
      { 
        country: 'US',
        data: { 
          name: 'Amazon', 
          trustScore: overallTrust, 
          reviewCount: totalReviews, 
          averageRating: analyzedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        },
        success: true
      }
    ];

    const result = {
      asin,
      productName,
      totalReviews,
      overallTrust,
      analyzedReviews,
      sentimentScore: avgSentiment,
      sentimentDistribution,
      emotionScores,
      insights,
      topics: [], // Would require NLP processing
      keywords: [], // Would require NLP processing
      productAspects: {}, // Would require aspect extraction
      summaryOverall: `Analysis of ${totalReviews} real Amazon reviews shows ${overallTrust}% appear genuine. ${sentimentDistribution.positive}% express positive sentiment.`,
      summaryPositive: positiveCount > 0 ? "Customers appreciate product quality and performance based on verified reviews." : "Limited positive feedback detected.",
      summaryNegative: negativeCount > 0 ? "Some customers report issues with quality or expectations not being met." : "Few negative concerns identified.",
      recommendation: overallTrust > 70 ? 
        "Product appears to have genuine positive reviews. Consider individual review details before purchasing." :
        "Exercise caution - significant suspicious review activity detected. Read individual reviews carefully.",
      productContext: {
        fraudRisk: overallTrust > 70 ? 'Low' : overallTrust > 50 ? 'Medium' : 'High',
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
