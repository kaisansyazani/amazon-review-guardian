
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";

interface AISummaryProps {
  summaryOverall?: string;
  summaryPositive?: string;
  summaryNegative?: string;
  recommendation?: string;
}

export const AISummary = ({ 
  summaryOverall, 
  summaryPositive, 
  summaryNegative, 
  recommendation 
}: AISummaryProps) => {
  // If no data is provided, show a default message
  const hasAnyData = summaryOverall || summaryPositive || summaryNegative || recommendation;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyData ? (
          <div className="p-6 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/50" />
            <p className="text-sm">AI analysis is being processed...</p>
          </div>
        ) : (
          <>
            {summaryOverall && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Overall Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">{summaryOverall}</p>
              </div>
            )}

            {summaryPositive && (
              <div className="p-4 bg-green-50 border-green-200 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-800">Positive Highlights</h4>
                </div>
                <p className="text-sm text-green-700">{summaryPositive}</p>
              </div>
            )}

            {summaryNegative && (
              <div className="p-4 bg-red-50 border-red-200 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-800">Areas of Concern</h4>
                </div>
                <p className="text-sm text-red-700">{summaryNegative}</p>
              </div>
            )}

            {recommendation && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-medium mb-2 text-primary">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground">{recommendation}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
