import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface TrustScoreProps {
  score: number;
  totalReviews: number;
}

export const TrustScore = ({ score, totalReviews }: TrustScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "trust-high";
    if (score >= 50) return "trust-medium";
    return "trust-low";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <ShieldCheck className="h-8 w-8" />;
    if (score >= 50) return <Shield className="h-8 w-8" />;
    return <ShieldAlert className="h-8 w-8" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "High Trust";
    if (score >= 50) return "Moderate Trust";
    return "Low Trust";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 75) return "Most reviews appear authentic with minimal suspicious activity.";
    if (score >= 50) return "Some suspicious patterns detected. Exercise caution when reading reviews.";
    return "Significant fake review activity detected. Be very careful with this product.";
  };

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle>Overall Trust Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full border-8 border-${getScoreColor(score)} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{score}%</div>
              </div>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center text-${getScoreColor(score)}`}>
              {getScoreIcon(score)}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`text-xl font-semibold text-${getScoreColor(score)} mb-1`}>
              {getScoreLabel(score)}
            </h3>
            <p className="text-muted-foreground mb-3">
              {getScoreDescription(score)}
            </p>
            <div className="text-sm text-muted-foreground">
              Based on analysis of {totalReviews} reviews
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};