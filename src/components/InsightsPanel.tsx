import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Eye, Users } from "lucide-react";

interface InsightsPanelProps {
  insights: string[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  const getInsightIcon = (index: number) => {
    const icons = [TrendingUp, AlertTriangle, Eye, Users];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-5 w-5 text-primary" />;
  };

  return (
    <Card className="shadow-card-custom h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            {getInsightIcon(index)}
            <p className="text-sm leading-relaxed">{insight}</p>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium mb-2 text-primary">Recommendation</h4>
          <p className="text-sm text-muted-foreground">
            Read reviews carefully and look for specific details about the product. 
            Be especially cautious of overly positive or negative reviews that lack substance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};