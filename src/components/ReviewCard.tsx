import { Review } from "@/types/review";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Bot, DollarSign, Skull, CheckCircle, AlertTriangle } from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'genuine':
        return <CheckCircle className="h-4 w-4" />;
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'malicious':
        return <Skull className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'genuine':
        return 'success';
      case 'paid':
        return 'warning';
      case 'bot':
        return 'secondary';
      case 'malicious':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'genuine':
        return 'Genuine Review';
      case 'paid':
        return 'Likely Paid';
      case 'bot':
        return 'Bot Generated';
      case 'malicious':
        return 'Malicious';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getClassificationColor(review.classification) as any} className="gap-1">
                  {getClassificationIcon(review.classification)}
                  {getClassificationLabel(review.classification)}
                </Badge>
                <span className="text-sm font-medium">{review.confidence}% confidence</span>
              </div>
              
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-warning text-warning' : 'text-muted-foreground'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  by {review.author} • {review.date}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed">{review.text}</p>

          <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-primary">
            <div className="text-xs font-medium text-muted-foreground mb-1">AI Analysis:</div>
            <div className="text-sm">{review.explanation}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
