
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScore } from "@/components/TrustScore";
import { ReviewCard } from "@/components/ReviewCard";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { AISummaries } from "@/components/AISummaries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Review } from "@/pages/Index";

interface AnalysisResult {
  id: string;
  asin: string;
  product_name: string;
  overall_trust: number;
  total_reviews: number;
  analyzed_reviews: Review[];
  insights: string[];
  created_at: string;
  sentiment_score?: number;
  sentiment_distribution?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  emotion_scores?: {
    [key: string]: number;
  };
  summary_positive?: string;
  summary_negative?: string;
  summary_overall?: string;
  recommendation?: string;
}

interface DetailedAnalysisViewProps {
  result: AnalysisResult;
  onBack: () => void;
}

export const DetailedAnalysisView = ({ result, onBack }: DetailedAnalysisViewProps) => {
  const generateAmazonUrl = (asin: string) => {
    return `https://www.amazon.com/dp/${asin}`;
  };

  const genuineCount = result.analyzed_reviews.filter(r => r.classification === 'genuine').length;
  const paidCount = result.analyzed_reviews.filter(r => r.classification === 'paid').length;
  const botCount = result.analyzed_reviews.filter(r => r.classification === 'bot').length;
  const maliciousCount = result.analyzed_reviews.filter(r => r.classification === 'malicious').length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{result.product_name || 'Product Analysis'}</h2>
            <p className="text-muted-foreground">ASIN: {result.asin}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a 
            href={generateAmazonUrl(result.asin)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Amazon
          </a>
        </Button>
      </div>

      <TrustScore score={result.overall_trust} totalReviews={result.total_reviews} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
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
              <Card className="shadow-card-custom h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <AISummaries 
            summaryPositive={result.summary_positive}
            summaryNegative={result.summary_negative}
            summaryOverall={result.summary_overall}
            recommendation={result.recommendation}
          />
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentAnalysis 
            sentimentScore={result.sentiment_score} 
            sentimentDistribution={result.sentiment_distribution}
            emotionScores={result.emotion_scores}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Review Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.analyzed_reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
