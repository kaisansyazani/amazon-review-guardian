
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TrustReasons = () => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle>Why Trust ReviewGuard?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-400">Multi-Source Validation</h4>
            <p className="text-sm text-muted-foreground">
              Cross-references data from multiple marketplaces and similar products for comprehensive analysis.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 dark:text-blue-400">Advanced AI Detection</h4>
            <p className="text-sm text-muted-foreground">
              Uses state-of-the-art NLP and pattern recognition to identify sophisticated fraud attempts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-purple-700 dark:text-purple-400">Real-time Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Processes the most recent reviews and current market data for up-to-date insights.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-orange-700 dark:text-orange-400">Transparent Scoring</h4>
            <p className="text-sm text-muted-foreground">
              Provides detailed explanations for all trust scores and fraud risk assessments.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
