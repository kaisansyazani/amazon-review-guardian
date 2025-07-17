import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, Target } from "lucide-react";

interface AISummariesProps {
  summaryPositive: string;
  summaryNegative: string;
  summaryOverall: string;
  recommendation: string;
}

export const AISummaries = ({ 
  summaryPositive, 
  summaryNegative, 
  summaryOverall, 
  recommendation 
}: AISummariesProps) => {
  return (
    <div className="space-y-6">
      {/* Positive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <ThumbsUp className="h-5 w-5" />
            What Customers Love
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {summaryPositive || "Analyzing positive feedback..."}
          </p>
        </CardContent>
      </Card>

      {/* Negative Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ThumbsDown className="h-5 w-5" />
            Common Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {summaryNegative || "Analyzing negative feedback..."}
          </p>
        </CardContent>
      </Card>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Overall Impression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {summaryOverall || "Generating overall analysis..."}
          </p>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">
              {recommendation || "Generating recommendation..."}
            </p>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              AI-Generated Insight
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};