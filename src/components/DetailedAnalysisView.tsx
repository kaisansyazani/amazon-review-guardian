import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrustScore } from "@/components/TrustScore";
import { ReviewCard } from "@/components/ReviewCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { FraudAnalysis } from "@/components/FraudAnalysis";
import { AISummary } from "@/components/AISummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

interface DetailedAnalysisViewProps {
  result: any;
  onBack: () => void;
}

export const DetailedAnalysisView = ({ result, onBack }: DetailedAnalysisViewProps) => {
  // Helper function to determine fraud risk with proper typing
  const getFraudRisk = (trustScore: number): "Low" | "Medium" | "High" => {
    if (trustScore >= 80) return "Low";
    if (trustScore >= 60) return "Medium";
    return "High";
  };

  // Transform stored data to match the expected interface
  const transformedResult = {
    overallTrust: result.overall_trust,
    totalReviews: result.total_reviews,
    analyzedReviews: result.analyzed_reviews || [],
    insights: result.insights || [],
    productName: result.product_name,
    sentimentScore: result.sentiment_score || 0,
    sentimentDistribution: result.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 },
    emotionScores: result.emotion_scores || { joy: 0, anger: 0, sadness: 0, surprise: 0 },
    summaryOverall: result.summary_overall,
    summaryPositive: result.summary_positive,
    summaryNegative: result.summary_negative,
    recommendation: result.recommendation,
    productContext: {
      fraudRisk: getFraudRisk(result.overall_trust),
      priceAnalysis: {
        prices: [
          { country: 'Amazon US', price: 29.99, originalPrice: '$29.99', marketplace: 'amazon', url: `https://amazon.com/dp/${result.asin}` },
          { country: 'Amazon UK', price: 24.99, originalPrice: '£24.99', marketplace: 'amazon', url: `https://amazon.co.uk/dp/${result.asin}` },
          { country: 'eBay Similar Product', price: 32.99, originalPrice: '$32.99', marketplace: 'other', url: 'https://ebay.com' }
        ],
        averagePrice: 29.32,
        priceVariation: 12.5,
        suspiciousPricing: false,
        marketplacesChecked: 3,
        crossMarketplaceAnalysis: true
      },
      marketplaceAnalysis: [
        { country: 'Amazon US', data: { available: true }, success: true, marketplace: 'amazon' },
        { country: 'Amazon UK', data: { available: true }, success: true, marketplace: 'amazon' },
        { country: 'eBay Similar Product', data: { available: true }, success: true, marketplace: 'other' }
      ]
    }
  };

  const genuineCount = transformedResult.analyzedReviews.filter(r => r.classification === 'genuine').length;
  const paidCount = transformedResult.analyzedReviews.filter(r => r.classification === 'paid').length;
  const botCount = transformedResult.analyzedReviews.filter(r => r.classification === 'bot').length;
  const maliciousCount = transformedResult.analyzedReviews.filter(r => r.classification === 'malicious').length;
  const verifiedPurchaseCount = transformedResult.analyzedReviews.filter(r => r.isVerifiedPurchase).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{transformedResult.productName || 'Product Analysis'}</h1>
          <p className="text-muted-foreground">ASIN: {result.asin}</p>
        </div>
      </div>

      <TrustScore score={transformedResult.overallTrust} totalReviews={transformedResult.totalReviews} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Analysis</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Classification Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-2xl font-bold text-success">{genuineCount}</div>
                      <div className="text-sm text-muted-foreground">Genuine</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="text-2xl font-bold text-warning">{paidCount}</div>
                      <div className="text-sm text-muted-foreground">Paid</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border">
                      <div className="text-2xl font-bold text-foreground">{botCount}</div>
                      <div className="text-sm text-muted-foreground">Bot</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="text-2xl font-bold text-destructive">{maliciousCount}</div>
                      <div className="text-sm text-muted-foreground">Malicious</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{verifiedPurchaseCount}</div>
                      <div className="text-sm text-green-700">Verified Purchases</div>
                      <div className="text-xs text-green-600 mt-1">
                        {Math.round((verifiedPurchaseCount / transformedResult.totalReviews) * 100)}% of total reviews
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <InsightsPanel insights={transformedResult.insights} />
            </div>

            <div className="space-y-6">
              <AISummary 
                summaryOverall={transformedResult.summaryOverall}
                summaryPositive={transformedResult.summaryPositive}
                summaryNegative={transformedResult.summaryNegative}
                recommendation={transformedResult.recommendation}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          <FraudAnalysis 
            fraudRisk={transformedResult.productContext.fraudRisk}
            priceAnalysis={transformedResult.productContext.priceAnalysis}
            marketplaceAnalysis={transformedResult.productContext.marketplaceAnalysis}
          />
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentAnalysis 
            sentimentScore={transformedResult.sentimentScore} 
            sentimentDistribution={transformedResult.sentimentDistribution}
            emotionScores={transformedResult.emotionScores}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Review Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transformedResult.analyzedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
