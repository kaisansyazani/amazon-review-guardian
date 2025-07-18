import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY') ?? ''; // SERP API
const apifyToken = Deno.env.get('APIFY_TOKEN') ?? '';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SERP API Functions (kept as backup and for marketplace prices)
async function fetchProductDetailsSERP(asin: string) {
  try {
    console.log(`[SERP] Fetching product details for ASIN: ${asin}`);
    
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
      console.error(`[SERP] Product details API failed: ${productResponse.status} - ${productResponse.statusText}`);
      return null;
    }

    const productData = await productResponse.json();
    console.log('[SERP] Product details API response received');

    return productData;
  } catch (error) {
    console.error('[SERP] Error fetching product details:', error);
    return null;
  }
}

async function fetchReviewsSERP(asin: string) {
  let realReviews = [];
  
  // Try to fetch from multiple pages to get at least 10 reviews
  for (let page = 1; page <= 3 && realReviews.length < 10; page++) {
    try {
      console.log(`[SERP] Fetching page ${page} of reviews for ASIN: ${asin}`);
      
      const reviewsResponse = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=US&page=${page}&sort_by=MOST_RECENT&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
        }
      );

      if (!reviewsResponse.ok) {
        console.error(`[SERP] API request failed for page ${page}: ${reviewsResponse.status} - ${reviewsResponse.statusText}`);
        continue;
      }

      const reviewsData = await reviewsResponse.json();
      console.log(`[SERP] Page ${page} reviews fetched: ${reviewsData.data?.reviews?.length || 0} reviews`);

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
      console.error(`[SERP] Error fetching page ${page}:`, pageError);
      continue;
    }
  }

  return realReviews.slice(0, 15);
}

// Improved Apify API Functions
async function fetchProductDetailsApify(productUrl: string) {
  try {
    console.log(`[Apify] Fetching product details for URL: ${productUrl}`);
    
    if (!apifyToken) {
      console.error('[Apify] API token not configured');
      return null;
    }
    
    const input = {
      "productUrls": [{ "url": productUrl }],
      "maxReviews": 0, // Only get product details, no reviews
      "includeGdprSensitive": false,
      "scrapeAdvancedReviews": false,
      "scrapeProductDetails": true,
      "deduplicateRedirectedAsins": true
    };

    console.log('[Apify] Starting product details scraping run...');
    const response = await fetch('https://api.apify.com/v2/acts/R8WeJwLuzLZ6g4Bkk/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Apify] Product details API failed: ${response.status} - ${response.statusText}`, errorText);
      return null;
    }

    const runData = await response.json();
    console.log('[Apify] Started product details run:', runData.id);

    // Wait for the run to complete
    const success = await waitForApifyRun(runData.id);
    if (!success) {
      console.error('[Apify] Product details run failed or timed out');
      return null;
    }

    // Fetch results
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
      },
    });

    if (!resultsResponse.ok) {
      console.error(`[Apify] Failed to fetch results: ${resultsResponse.status}`);
      return null;
    }

    const results = await resultsResponse.json();
    console.log('[Apify] Product details results fetched:', results.length, 'items');

    return results[0] || null;
  } catch (error) {
    console.error('[Apify] Error fetching product details:', error);
    return null;
  }
}

async function fetchReviewsApify(productUrl: string) {
  try {
    console.log(`[Apify] Fetching reviews for URL: ${productUrl}`);
    
    if (!apifyToken) {
      console.error('[Apify] API token not configured');
      return [];
    }
    
    const input = {
      "productUrls": [{ "url": productUrl }],
      "maxReviews": 50,
      "includeGdprSensitive": false,
      "scrapeAdvancedReviews": true,
      "sort": "helpful",
      "filterByRatings": ["allStars"],
      "reviewsUseProductVariantFilter": false,
      "reviewMediaTypes": [],
      "scrapeQuickProductReviews": false,
      "scrapeProductDetails": false,
      "reviewsAlwaysSaveCategoryData": false,
      "deduplicateRedirectedAsins": true
    };

    console.log('[Apify] Starting reviews scraping run...');
    const response = await fetch('https://api.apify.com/v2/acts/R8WeJwLuzLZ6g4Bkk/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Apify] Reviews API failed: ${response.status} - ${response.statusText}`, errorText);
      return [];
    }

    const runData = await response.json();
    console.log('[Apify] Started reviews run:', runData.id);

    // Wait for the run to complete
    const success = await waitForApifyRun(runData.id);
    if (!success) {
      console.error('[Apify] Reviews run failed or timed out');
      return [];
    }

    // Fetch results
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
      },
    });

    if (!resultsResponse.ok) {
      console.error(`[Apify] Failed to fetch review results: ${resultsResponse.status}`);
      return [];
    }

    const results = await resultsResponse.json();
    console.log('[Apify] Reviews results fetched:', results.length, 'items');

    // Convert Apify reviews to our format
    const formattedReviews = [];
    
    for (const item of results) {
      if (item.reviews && Array.isArray(item.reviews)) {
        item.reviews.forEach((review: any, index: number) => {
          formattedReviews.push({
            id: `apify-${index + 1}`,
            text: review.text || review.content || review.reviewText || 'No review text available',
            rating: review.rating || review.stars || 5,
            date: review.date || new Date().toISOString().split('T')[0],
            author: review.author || review.reviewerName || 'Anonymous',
            verified: review.verified || review.verifiedPurchase || false
          });
        });
      }
    }

    console.log('[Apify] Formatted reviews:', formattedReviews.length);
    return formattedReviews.slice(0, 15);
  } catch (error) {
    console.error('[Apify] Error fetching reviews:', error);
    return [];
  }
}

async function waitForApifyRun(runId: string, maxWaitTime = 180000) {
  const startTime = Date.now();
  
  console.log(`[Apify] Waiting for run ${runId} to complete...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch(`https://api.apify.com/v2/acts/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
        },
      });

      if (response.ok) {
        const runData = await response.json();
        console.log(`[Apify] Run ${runId} status: ${runData.status}`);
        
        if (runData.status === 'SUCCEEDED') {
          console.log(`[Apify] Run ${runId} completed successfully`);
          return true;
        } else if (runData.status === 'FAILED') {
          console.error(`[Apify] Run ${runId} failed:`, runData.statusMessage);
          return false;
        }
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`[Apify] Error checking run status:`, error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.warn(`[Apify] Run ${runId} timed out after ${maxWaitTime}ms`);
  return false;
}

async function searchSimilarProducts(productTitle: string, category: string) {
  try {
    console.log(`Searching for similar products: ${productTitle}`);
    
    // Extract key terms from product title for better search
    const searchTerms = productTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3 && !['amazon', 'the', 'and', 'for', 'with'].includes(word))
      .slice(0, 3)
      .join(' ');

    const searchResponse = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(searchTerms)}&page=1&country=US&sort_by=RELEVANCE&product_condition=ALL`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error(`Search API failed: ${searchResponse.status} - ${searchResponse.statusText}`);
      return [];
    }

    const searchData = await searchResponse.json();
    console.log('Search API response for similar products received');

    // Return first 5 similar products for price comparison
    return searchData?.data?.products?.slice(0, 5) || [];
  } catch (error) {
    console.error('Error searching for similar products:', error);
    return [];
  }
}

async function fetchMultiMarketplacePrices(asin: string) {
  const countries = ['US', 'UK', 'DE', 'CA', 'FR'];
  const marketplaceData = [];
  
  for (const country of countries) {
    try {
      console.log(`Fetching price data for ASIN: ${asin} in country: ${country}`);
      
      const response = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=${country}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.product_price) {
          const price = parseFloat(data.data.product_price.toString().replace(/[^0-9.]/g, ''));
          const originalPrice = data.data.product_original_price ? 
            parseFloat(data.data.product_original_price.toString().replace(/[^0-9.]/g, '')) : price;
          
          marketplaceData.push({
            country: `Amazon ${country}`,
            price,
            originalPrice: data.data.product_price.toString(),
            marketplace: 'amazon',
            success: true,
            data: {
              name: `Amazon ${country}`,
              trustScore: 85, // Amazon is generally trustworthy
              reviewCount: data.data.product_num_ratings || 0,
              averageRating: parseFloat(data.data.product_star_rating || '0'),
              price,
              availability: data.data.product_availability || 'Available'
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching price for ${country}:`, error);
      marketplaceData.push({
        country: `Amazon ${country}`,
        price: 0,
        originalPrice: 'N/A',
        marketplace: 'amazon',
        success: false,
        data: null
      });
    }
  }

  return marketplaceData;
}

async function analyzePricing(productData: any, similarProducts: any[], marketplacePrices: any[]) {
  console.log('Analyzing pricing with cross-marketplace and similar product data');
  
  const allPrices = [];
  const marketplaceAnalysis = [];
  
  // Add original product price
  if (productData?.data?.product_price || productData?.price) {
    const price = parseFloat((productData?.data?.product_price || productData?.price).toString().replace(/[^0-9.]/g, ''));
    allPrices.push(price);
  }

  // Add marketplace prices
  marketplacePrices.forEach(marketplace => {
    if (marketplace.success && marketplace.price > 0) {
      allPrices.push(marketplace.price);
      marketplaceAnalysis.push(marketplace);
    }
  });

  // Add similar product prices for comparison
  const similarProductPrices = [];
  similarProducts.forEach(product => {
    if (product.product_price) {
      const price = parseFloat(product.product_price.toString().replace(/[^0-9.]/g, ''));
      if (price > 0) {
        similarProductPrices.push(price);
        allPrices.push({
          country: `Similar Product (${product.product_title?.substring(0, 30)}...)`,
          price,
          originalPrice: product.product_price.toString(),
          marketplace: 'other'
        });
      }
    }
  });

  if (allPrices.length === 0) {
    return {
      prices: [],
      averagePrice: 0,
      priceVariation: 0,
      suspiciousPricing: false,
      marketplacesChecked: 0,
      crossMarketplaceAnalysis: false,
      similarProductsChecked: similarProducts.length
    };
  }

  // Calculate price statistics
  const numericPrices = allPrices.filter(p => typeof p === 'number');
  const averagePrice = numericPrices.reduce((sum, price) => sum + price, 0) / numericPrices.length;
  const minPrice = Math.min(...numericPrices);
  const maxPrice = Math.max(...numericPrices);
  const priceVariation = numericPrices.length > 1 ? ((maxPrice - minPrice) / averagePrice) * 100 : 0;

  // Detect suspicious pricing patterns
  const suspiciousPricing = 
    priceVariation > 50 || // High price variation across markets
    minPrice < 5 || // Extremely low prices
    (similarProductPrices.length > 0 && 
     Math.min(...numericPrices) < Math.min(...similarProductPrices) * 0.3); // Much cheaper than similar products

  // Format prices for display
  const formattedPrices = allPrices
    .filter(p => typeof p === 'object')
    .concat(
      marketplaceAnalysis.map(m => ({
        country: m.country,
        price: m.price,
        originalPrice: m.originalPrice,
        marketplace: m.marketplace
      }))
    );

  return {
    prices: formattedPrices,
    averagePrice,
    priceVariation,
    suspiciousPricing,
    marketplacesChecked: marketplaceAnalysis.length,
    crossMarketplaceAnalysis: marketplaceAnalysis.length >= 3,
    similarProductsChecked: similarProducts.length
  };
}

// Function to extract product information (updated for Apify format)
function extractProductInfo(productData: any) {
  if (!productData) {
    return {
      productName: "Amazon Product",
      category: "Unknown",
      brand: "Unknown",
      availability: "Unknown"
    };
  }

  // Handle both SERP API and Apify formats
  const product = productData.data || productData;
  
  return {
    productName: product.product_title || product.title || product.name || "Amazon Product",
    category: product.product_category || product.category || "Unknown",
    brand: product.brand || product.product_brand || "Unknown",
    availability: product.product_availability || product.availability || "Available",
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

    // Try Apify first, fallback to SERP if needed
    let productDetailsData = null;
    let reviewsResult = [];
    let dataSource = 'Unknown';

    // Try Apify API first
    if (apifyToken) {
      console.log('[Strategy] Trying Apify API first...');
      const [apifyProductResult, apifyReviewsResult] = await Promise.allSettled([
        fetchProductDetailsApify(url),
        fetchReviewsApify(url)
      ]);

      if (apifyProductResult.status === 'fulfilled' && apifyProductResult.value) {
        productDetailsData = apifyProductResult.value;
        dataSource = 'Apify';
        console.log('[Strategy] Using Apify for product details');
      }

      if (apifyReviewsResult.status === 'fulfilled' && apifyReviewsResult.value && apifyReviewsResult.value.length > 0) {
        reviewsResult = apifyReviewsResult.value;
        dataSource = 'Apify';
        console.log('[Strategy] Using Apify for reviews');
      }
    }

    // Fallback to SERP API if Apify didn't work
    if (!productDetailsData || reviewsResult.length === 0) {
      console.log('[Strategy] Falling back to SERP API...');
      
      if (!productDetailsData) {
        productDetailsData = await fetchProductDetailsSERP(asin);
        if (productDetailsData) {
          dataSource = 'SERP';
          console.log('[Strategy] Using SERP for product details');
        }
      }

      if (reviewsResult.length === 0) {
        reviewsResult = await fetchReviewsSERP(asin);
        if (reviewsResult.length > 0) {
          dataSource = 'SERP';
          console.log('[Strategy] Using SERP for reviews');
        }
      }
    }

    // Get marketplace prices (always use SERP for this)
    const marketplacePrices = await fetchMultiMarketplacePrices(asin);
    
    // Extract product information
    const productInfo = extractProductInfo(productDetailsData);
    
    // Search for similar products for price comparison (using SERP API)
    const similarProducts = await searchSimilarProducts(productInfo.productName, productInfo.category);
    
    // Enhanced price analysis with cross-marketplace and similar product comparison
    const priceAnalysis = await analyzePricing(productDetailsData, similarProducts, marketplacePrices);

    console.log(`Successfully fetched product details, ${reviewsResult.length} reviews, ${marketplacePrices.length} marketplace prices, and ${similarProducts.length} similar products using ${dataSource}`);

    // Handle case where no reviews are available (e.g., pre-order products)
    if (reviewsResult.length === 0) {
      console.log('No reviews found - handling as pre-order or new product');
      
      // Enhanced marketplace analysis including similar product comparison
      const enhancedMarketplaceAnalysis = marketplacePrices.length > 0 ? marketplacePrices : [
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
      ];

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
          `No reviews available for analysis (using ${dataSource} API)`,
          'This appears to be a new or pre-order product',
          `Product availability: ${productInfo.availability}`,
          `Current price: $${priceAnalysis.averagePrice > 0 ? priceAnalysis.averagePrice.toFixed(2) : 'Not available'}`,
          `Price compared across ${priceAnalysis.marketplacesChecked} marketplaces`,
          `${similarProducts.length} similar products found for price comparison`,
          priceAnalysis.suspiciousPricing ? 'Suspicious pricing patterns detected' : 'Pricing appears normal compared to similar products',
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
        summaryOverall: `This ${productInfo.productName} currently has no customer reviews available. Price analysis across ${priceAnalysis.marketplacesChecked} marketplaces and ${similarProducts.length} similar products shows ${priceAnalysis.suspiciousPricing ? 'suspicious pricing patterns' : 'normal pricing'}.`,
        summaryPositive: "No positive reviews to analyze yet.",
        summaryNegative: "No negative reviews to analyze yet.",
        recommendation: priceAnalysis.marketplacesChecked < 3 ?
          `High fraud risk due to limited marketplace coverage (${priceAnalysis.marketplacesChecked}/3 minimum). Consider waiting for more market data before purchase.` :
          (priceAnalysis.suspiciousPricing ? 
            `Caution advised - suspicious pricing detected when compared to similar products. Verify seller authenticity before purchase.` :
            `Pricing appears consistent across markets. As a new item, consider researching similar products or waiting for initial customer feedback.`),
        productContext: {
          fraudRisk: (priceAnalysis.marketplacesChecked < 3 || priceAnalysis.suspiciousPricing) ? 'High' : 'Medium' as const,
          priceAnalysis,
          marketplaceAnalysis: enhancedMarketplaceAnalysis
        }
      };

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
    const analyzedReviews = reviewsResult.map(review => {
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

    // Generate insights with enhanced price analysis information
    const botCount = analyzedReviews.filter(r => r.classification === 'bot').length;
    const paidCount = analyzedReviews.filter(r => r.classification === 'paid').length;
    const maliciousCount = analyzedReviews.filter(r => r.classification === 'malicious').length;
    
    const insights = [
      `${Math.round((genuineCount / totalReviews) * 100)}% of reviews appear genuine (via ${dataSource} API)`,
      `${sentimentDistribution.positive}% positive sentiment detected`,
      `Average sentiment score: ${avgSentiment.toFixed(2)}`,
      `${botCount} potential bot reviews identified`,
      `${paidCount} likely paid reviews detected`,
      `${maliciousCount} potentially malicious reviews found`,
      `Product price: $${priceAnalysis.averagePrice.toFixed(2)}`,
      `Price variation across ${priceAnalysis.marketplacesChecked} marketplaces: ${priceAnalysis.priceVariation.toFixed(1)}%`,
      `${similarProducts.length} similar products analyzed for price comparison`,
      priceAnalysis.suspiciousPricing ? 'Suspicious pricing patterns detected compared to similar products' : 'Pricing appears consistent with similar products'
    ];

    // Enhanced marketplace analysis with cross-platform data
    const enhancedMarketplaceAnalysis = marketplacePrices.length > 0 ? marketplacePrices : [
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

    // Determine fraud risk based on multiple factors including enhanced price analysis
    let fraudRisk: 'Low' | 'Medium' | 'High' = 'Low';
    if (overallTrust < 50 || priceAnalysis.suspiciousPricing || priceAnalysis.marketplacesChecked < 3) {
      fraudRisk = 'High';
    } else if (overallTrust < 70 || paidCount > totalReviews * 0.3) {
      fraudRisk = 'Medium';
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
      summaryOverall: `Analysis of ${totalReviews} real Amazon reviews for ${productInfo.productName} (via ${dataSource} API) shows ${overallTrust}% appear genuine. Cross-marketplace price analysis across ${priceAnalysis.marketplacesChecked} markets reveals ${priceAnalysis.suspiciousPricing ? 'suspicious pricing patterns' : 'consistent pricing'}. Current price: $${priceAnalysis.averagePrice.toFixed(2)}.`,
      summaryPositive: positiveCount > 0 ? "Customers appreciate product quality and performance based on verified reviews." : "Limited positive feedback detected.",
      summaryNegative: negativeCount > 0 ? "Some customers report issues with quality or expectations not being met." : "Few negative concerns identified.",
      recommendation: overallTrust > 70 && priceAnalysis.marketplacesChecked >= 3 && !priceAnalysis.suspiciousPricing ? 
        `Product appears to have genuine positive reviews and consistent pricing across ${priceAnalysis.marketplacesChecked} marketplaces at $${priceAnalysis.averagePrice.toFixed(2)}. Consider individual review details before purchasing.` :
        `Exercise caution - ${priceAnalysis.marketplacesChecked < 3 ? 'insufficient marketplace coverage, ' : ''}${priceAnalysis.suspiciousPricing ? 'suspicious pricing patterns detected, ' : ''}${overallTrust < 70 ? 'questionable review authenticity detected' : ''}. Read individual reviews carefully and verify seller credentials.`,
      productContext: {
        fraudRisk,
        priceAnalysis,
        marketplaceAnalysis: enhancedMarketplaceAnalysis
      }
    };

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
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
