
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TrustScoreProps {
  score: number;
  totalReviews: number;
}

export const TrustScore = ({ score, totalReviews }: TrustScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-trust-high border-trust-high";
    if (score >= 50) return "text-trust-medium border-trust-medium";
    return "text-trust-low border-trust-low";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <ShieldCheck className="h-6 w-6 text-trust-high" />;
    if (score >= 50) return <Shield className="h-6 w-6 text-trust-medium" />;
    return <ShieldAlert className="h-6 w-6 text-trust-low" />;
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

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-trust-high";
    if (score >= 50) return "bg-trust-medium";
    return "bg-trust-low";
  };

  return (
    <Card className="shadow-analysis border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {getScoreIcon(score)}
          Overall Trust Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(score).split(' ')[0]}`}>
                  {score}%
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Trust Score
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-background rounded-full shadow-lg border">
              {getScoreIcon(score)}
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${getScoreColor(score).split(' ')[0]}`}>
                {getScoreLabel(score)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {getScoreDescription(score)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trust Level</span>
                <span className="font-medium">{score}%</span>
              </div>
              <div className="relative">
                <Progress value={score} className="h-3" />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{totalReviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{Math.round((score / 100) * totalReviews)}</div>
                <div className="text-xs text-muted-foreground">Genuine</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{totalReviews - Math.round((score / 100) * totalReviews)}</div>
                <div className="text-xs text-muted-foreground">Suspicious</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
