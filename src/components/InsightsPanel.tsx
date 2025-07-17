
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Eye, Users, Shield, CheckCircle } from "lucide-react";

interface InsightsPanelProps {
  insights: string[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  const getInsightIcon = (insight: string) => {
    if (insight.includes('fraud') || insight.includes('risk')) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    if (insight.includes('suspicious') || insight.includes('⚠️')) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    if (insight.includes('verified') || insight.includes('✓')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (insight.includes('marketplace')) return <Users className="h-4 w-4 text-blue-600" />;
    if (insight.includes('price') || insight.includes('💰')) return <TrendingUp className="h-4 w-4 text-purple-600" />;
    if (insight.includes('Low fraud') || insight.includes('✅')) return <Shield className="h-4 w-4 text-green-600" />;
    return <Eye className="h-4 w-4 text-primary" />;
  };

  const getInsightStyle = (insight: string) => {
    if (insight.includes('High fraud') || insight.includes('🚨')) return 'bg-red-50 border-red-200';
    if (insight.includes('Medium fraud') || insight.includes('⚡')) return 'bg-yellow-50 border-yellow-200';
    if (insight.includes('Low fraud') || insight.includes('✅')) return 'bg-green-50 border-green-200';
    if (insight.includes('suspicious') || insight.includes('⚠️')) return 'bg-orange-50 border-orange-200';
    return 'bg-muted/30 border-muted';
  };

  return (
    <Card className="shadow-card-custom h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${getInsightStyle(insight)}`}>
            {getInsightIcon(insight)}
            <p className="text-sm leading-relaxed flex-1">{insight}</p>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium mb-2 text-primary">AI Recommendation</h4>
          <p className="text-sm text-muted-foreground">
            Read reviews carefully and look for specific details about the product. 
            Be especially cautious of overly positive or negative reviews that lack substance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
