
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface TrustScoreProps {
  score: number;
  totalReviews: number;
}

export const TrustScore = ({ score, totalReviews }: TrustScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600 border-green-600";
    if (score >= 50) return "text-yellow-600 border-yellow-600";
    return "text-red-600 border-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <ShieldCheck className="h-6 w-6 text-green-600" />;
    if (score >= 50) return <Shield className="h-6 w-6 text-yellow-600" />;
    return <ShieldAlert className="h-6 w-6 text-red-600" />;
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

  const getScoreLabelColor = (score: number) => {
    if (score >= 75) return "text-green-700";
    if (score >= 50) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle>Overall Trust Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className={`w-24 h-24 rounded-full border-4 ${getScoreColor(score)} flex items-center justify-center bg-background`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{score}%</div>
              </div>
            </div>
            <div className="absolute top-1 right-1">
              {getScoreIcon(score)}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`text-xl font-semibold ${getScoreLabelColor(score)} mb-1`}>
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
