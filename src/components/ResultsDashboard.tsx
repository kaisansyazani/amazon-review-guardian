import { AnalysisResult } from "@/pages/Index";
import { TrustScore } from "@/components/TrustScore";
import { ReviewCard } from "@/components/ReviewCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrustScore score={results.overallTrust} totalReviews={results.totalReviews} />
          
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
        </div>

        <div>
          <InsightsPanel insights={results.insights} />
        </div>
      </div>
    </div>
  );
};