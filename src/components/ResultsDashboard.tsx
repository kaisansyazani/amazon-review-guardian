import { AnalysisResult } from "@/pages/Index";
import { TrustScore } from "@/components/TrustScore";
import { ReviewCard } from "@/components/ReviewCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { TopicsAndKeywords } from "@/components/TopicsAndKeywords";
import { AISummaries } from "@/components/AISummaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw } from "lucide-react";

interface ResultsDashboardProps {
  results: AnalysisResult;
  onReset: () => void;
}

export const ResultsDashboard = ({ results, onReset }: ResultsDashboardProps) => {
  const genuineCount = results.analyzedReviews.filter(r => r.classification === 'genuine').length;
  const paidCount = results.analyzedReviews.filter(r => r.classification === 'paid').length;
  const botCount = results.analyzedReviews.filter(r => r.classification === 'bot').length;
  const maliciousCount = results.analyzedReviews.filter(r => r.classification === 'malicious').length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Analyze Another Product
        </Button>
      </div>

      <TrustScore score={results.overallTrust} totalReviews={results.totalReviews} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="summaries">AI Summary</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Review Classification Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </CardContent>
              </Card>
            </div>
            <div>
              <InsightsPanel insights={results.insights} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentAnalysis 
            sentimentScore={results.sentimentScore} 
            sentimentDistribution={results.sentimentDistribution}
            emotionScores={results.emotionScores}
          />
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <TopicsAndKeywords 
            topics={results.topics}
            keywords={results.keywords}
            productAspects={results.productAspects}
          />
        </TabsContent>

        <TabsContent value="summaries" className="space-y-6">
          <AISummaries 
            summaryPositive={results.summaryPositive}
            summaryNegative={results.summaryNegative}
            summaryOverall={results.summaryOverall}
            recommendation={results.recommendation}
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