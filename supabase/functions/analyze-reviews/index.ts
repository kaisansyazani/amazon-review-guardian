import { serve } from 'std/server';
import { cors } from '../_shared/cors.ts';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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

    // Simulate fetching reviews (in real implementation, this would scrape Amazon)
    const mockReviews = [
      {
        id: '1',
        text: 'Amazing product! Works exactly as described. Very happy with my purchase and would definitely recommend it to others.',
        rating: 5,
        date: '2024-01-15',
        author: 'John D.',
        verified: true
      },
      {
        id: '2',
        text: 'Good quality but took longer to arrive than expected. Product works well though.',
        rating: 4,
        date: '2024-01-10',
        author: 'Sarah M.',
        verified: true
      },
      {
        id: '3',
        text: 'Best product ever! 5 stars! Amazing! Buy now!',
        rating: 5,
        date: '2024-01-08',
        author: 'ReviewBot123',
        verified: false
      },
      {
        id: '4',
        text: 'Terrible quality. Broke after one use. Complete waste of money. Do not buy this product.',
        rating: 1,
        date: '2024-01-05',
        author: 'Angry Customer',
        verified: true
      },
      {
        id: '5',
        text: 'Decent product for the price. Not amazing but does what it says.',
        rating: 3,
        date: '2024-01-03',
        author: 'Mike R.',
        verified: true
      }
    ];

    // Analyze each review
    const analyzedReviews = mockReviews.map(review => {
      // Simple classification logic
      let classification: 'genuine' | 'paid' | 'bot' | 'malicious';
      let confidence = 85;
      let explanation = '';

      if (!review.verified || review.text.length < 20) {
        classification = 'bot';
        explanation = 'Unverified purchase with suspiciously short review text';
        confidence = 92;
      } else if (review.text.includes('Best product ever') || review.text.includes('Buy now')) {
        classification = 'paid';
        explanation = 'Contains promotional language typical of paid reviews';
        confidence = 88;
      } else if (review.rating === 1 && review.text.includes('waste of money')) {
        classification = 'malicious';
        explanation = 'Extremely negative language that may be from a competitor';
        confidence = 75;
      } else {
        classification = 'genuine';
        explanation = 'Natural language patterns and verified purchase indicate authentic review';
        confidence = 90;
      }

      // Calculate sentiment score based on rating and text analysis
      let sentimentScore = 0;
      if (review.rating >= 4) {
        sentimentScore = 0.6 + (review.rating - 4) * 0.3;
      } else if (review.rating <= 2) {
        sentimentScore = -0.6 - (2 - review.rating) * 0.3;
      } else {
        sentimentScore = (review.rating - 3) * 0.2;
      }

      // Adjust sentiment based on text content
      if (review.text.toLowerCase().includes('amazing') || review.text.toLowerCase().includes('excellent')) {
        sentimentScore += 0.2;
      }
      if (review.text.toLowerCase().includes('terrible') || review.text.toLowerCase().includes('awful')) {
        sentimentScore -= 0.2;
      }

      return {
        ...review,
        classification,
        confidence,
        explanation,
        sentimentScore: Math.max(-1, Math.min(1, sentimentScore))
      };
    });

    // Calculate overall sentiment metrics
    const totalReviews = analyzedReviews.length;
    const avgSentiment = analyzedReviews.reduce((sum, r) => sum + r.sentimentScore, 0) / totalReviews;
    
    const positiveCount = analyzedReviews.filter(r => r.sentimentScore > 0.2).length;
    const neutralCount = analyzedReviews.filter(r => r.sentimentScore >= -0.2 && r.sentimentScore <= 0.2).length;
    const negativeCount = analyzedReviews.filter(r => r.sentimentScore < -0.2).length;

    const sentimentDistribution = {
      positive: Math.round((positiveCount / totalReviews) * 100),
      neutral: Math.round((neutralCount / totalReviews) * 100),
      negative: Math.round((negativeCount / totalReviews) * 100)
    };

    // Calculate emotion scores
    const emotionScores = {
      joy: analyzedReviews.filter(r => r.text.toLowerCase().includes('happy') || r.text.toLowerCase().includes('amazing')).length / totalReviews,
      anger: analyzedReviews.filter(r => r.text.toLowerCase().includes('angry') || r.text.toLowerCase().includes('terrible')).length / totalReviews,
      surprise: analyzedReviews.filter(r => r.text.toLowerCase().includes('unexpected') || r.text.toLowerCase().includes('surprised')).length / totalReviews,
      sadness: analyzedReviews.filter(r => r.text.toLowerCase().includes('disappointed') || r.text.toLowerCase().includes('sad')).length / totalReviews
    };

    // Calculate trust score
    const genuineCount = analyzedReviews.filter(r => r.classification === 'genuine').length;
    const overallTrust = Math.round((genuineCount / totalReviews) * 100);

    // Generate insights
    const insights = [
      `${Math.round((genuineCount / totalReviews) * 100)}% of reviews appear genuine`,
      `${sentimentDistribution.positive}% positive sentiment detected`,
      `Average sentiment score: ${avgSentiment.toFixed(2)}`,
      `${analyzedReviews.filter(r => r.classification === 'bot').length} potential bot reviews identified`
    ];

    // Simulate cross-marketplace price analysis
    const priceAnalysis = {
      amazonPrice: 49.99,
      lowestPrice: 39.99,
      highestPrice: 59.99,
      averagePrice: 47.33,
      priceRange: 'Competitive',
      marketplaces: ['Amazon', 'eBay', 'Walmart', 'Target']
    };

    // Simulate marketplace analysis
    const marketplaceAnalysis = [
      { name: 'Amazon', trustScore: 85, reviewCount: totalReviews, averageRating: 4.2 },
      { name: 'eBay', trustScore: 72, reviewCount: 23, averageRating: 3.8 },
      { name: 'Walmart', trustScore: 78, reviewCount: 15, averageRating: 4.0 },
      { name: 'Target', trustScore: 80, reviewCount: 12, averageRating: 4.1 }
    ];

    const result = {
      asin,
      productName: "Sample Product",
      totalReviews,
      overallTrust,
      analyzedReviews,
      sentimentScore: avgSentiment,
      sentimentDistribution,
      emotionScores,
      insights,
      summaryOverall: "This product shows mixed reviews with both positive and concerning elements.",
      summaryPositive: "Customers appreciate the product's functionality and value for money.",
      summaryNegative: "Some concerns about delivery times and occasional quality issues.",
      recommendation: "Consider reading individual reviews carefully and comparing prices across platforms before purchasing.",
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
