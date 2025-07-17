
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};
