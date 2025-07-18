
import { AnalysisResult } from "@/pages/Index";
import { TrustScore } from "@/components/TrustScore";
import { ReviewCard } from "@/components/ReviewCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { FraudAnalysis } from "@/components/FraudAnalysis";
import { AISummary } from "@/components/AISummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw } from "lucide-react";

interface ResultsDashboardProps {
  results: AnalysisResult;
  onReset: () => void;
}

export const ResultsDashboard = ({ results, onReset }: ResultsDashboardProps) => {
  // Calculate adjusted trust score based on verified purchases and confidence boosts
  const calculateAdjustedTrustScore = () => {
    if (results.analyzedReviews.length === 0) return results.overallTrust;
    
    let totalAdjustedConfidence = 0;
    let verifiedPurchaseBonus = 0;
    
    results.analyzedReviews.forEach(review => {
      let adjustedConfidence = review.confidence;
      
      // Apply verified purchase boost
      if (review.isVerifiedPurchase) {
        adjustedConfidence = Math.min(100, adjustedConfidence + 15);
        verifiedPurchaseBonus += 5; // Additional overall trust bonus
      }
      
      totalAdjustedConfidence += adjustedConfidence;
    });
    
    const averageAdjustedConfidence = totalAdjustedConfidence / results.analyzedReviews.length;
    const verifiedPurchaseCount = results.analyzedReviews.filter(r => r.isVerifiedPurchase).length;
    const verifiedPurchaseRatio = verifiedPurchaseCount / results.analyzedReviews.length;
    
    // Calculate final trust score with bonuses
    let finalTrustScore = averageAdjustedConfidence + (verifiedPurchaseRatio * 10);
    
    return Math.min(100, Math.round(finalTrustScore));
  };

  const adjustedTrustScore = calculateAdjustedTrustScore();
  
  const genuineCount = results.analyzedReviews.filter(r => r.classification === 'genuine').length;
  const paidCount = results.analyzedReviews.filter(r => r.classification === 'paid').length;
  const botCount = results.analyzedReviews.filter(r => r.classification === 'bot').length;
  const maliciousCount = results.analyzedReviews.filter(r => r.classification === 'malicious').length;
  const verifiedPurchaseCount = results.analyzedReviews.filter(r => r.isVerifiedPurchase).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Analyze Another Product
        </Button>
      </div>

      <TrustScore score={adjustedTrustScore} totalReviews={results.totalReviews} />

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
                  
                  {/* Verified Purchase Summary */}
                  <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{verifiedPurchaseCount}</div>
                      <div className="text-sm text-green-700">Verified Purchases</div>
                      <div className="text-xs text-green-600 mt-1">
                        {Math.round((verifiedPurchaseCount / results.totalReviews) * 100)}% of total reviews
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <InsightsPanel insights={results.insights} />
            </div>

            <div className="space-y-6">
              <AISummary 
                summaryOverall={results.summaryOverall}
                summaryPositive={results.summaryPositive}
                summaryNegative={results.summaryNegative}
                recommendation={results.recommendation}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          {results.productContext ? (
            <FraudAnalysis 
              fraudRisk={results.productContext.fraudRisk}
              priceAnalysis={results.productContext.priceAnalysis}
              marketplaceAnalysis={results.productContext.marketplaceAnalysis}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Fraud analysis data not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentAnalysis 
            sentimentScore={results.sentimentScore} 
            sentimentDistribution={results.sentimentDistribution}
            emotionScores={results.emotionScores}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Review Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.analyzedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
