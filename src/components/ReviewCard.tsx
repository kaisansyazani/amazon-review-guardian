
import { Review } from "@/types/review";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Bot, DollarSign, Skull, CheckCircle, AlertTriangle, Smile, Frown, Meh, Image, Video, X, ShieldCheck, ShieldX } from "lucide-react";

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

  const getSentimentIndicator = (rating: number) => {
    if (rating >= 4) {
      return {
        icon: <Smile className="h-4 w-4" />,
        variant: 'positive' as const,
        label: 'Positive'
      };
    } else if (rating <= 2) {
      return {
        icon: <Frown className="h-4 w-4" />,
        variant: 'negative' as const,
        label: 'Negative'
      };
    } else {
      return {
        icon: <Meh className="h-4 w-4" />,
        variant: 'neutral' as const,
        label: 'Neutral'
      };
    }
  };

  const sentiment = getSentimentIndicator(review.rating);

  // Adjust confidence based on verified purchase and media presence
  const getAdjustedConfidence = () => {
    let adjustedConfidence = review.confidence;
    
    if (review.isVerifiedPurchase) {
      adjustedConfidence = Math.min(100, adjustedConfidence + 15); // Boost confidence for verified purchases
    }
    
    return adjustedConfidence;
  };

  // Adjust confidence explanation based on media presence and verified purchase
  const getConfidenceExplanation = () => {
    let explanation = review.explanation;
    
    if (review.isVerifiedPurchase) {
      explanation += " This is a verified purchase, which significantly increases authenticity confidence.";
    }
    
    if (review.hasImage || review.hasVideo) {
      explanation += ` Review includes ${review.hasImage ? 'images' : ''}${review.hasImage && review.hasVideo ? ' and ' : ''}${review.hasVideo ? 'videos' : ''}, which increases authenticity confidence.`;
    } else if (review.classification === 'genuine') {
      explanation += " Note: Review lacks visual content (images/videos), which slightly reduces confidence in authenticity.";
    }
    
    return explanation;
  };

  const adjustedConfidence = getAdjustedConfidence();

  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Verified Purchase badge - most prominent */}
                {review.isVerifiedPurchase ? (
                  <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-800 border-green-300 hover:bg-green-100 font-semibold">
                    <ShieldCheck className="h-3 w-3 fill-green-600 text-green-600" />
                    Verified Purchase
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs bg-red-50 text-red-800 border-red-300 hover:bg-red-100 font-semibold">
                    <ShieldX className="h-3 w-3 fill-red-600 text-red-600" />
                    Not Verified
                  </Badge>
                )}
                <Badge variant={getClassificationColor(review.classification) as any} className="gap-1">
                  {getClassificationIcon(review.classification)}
                  {getClassificationLabel(review.classification)}
                </Badge>
                <Badge variant={sentiment.variant} className="gap-1">
                  {sentiment.icon}
                  {sentiment.label}
                </Badge>
                {/* Star rating badge */}
                <Badge variant="outline" className="gap-1 text-xs bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {review.rating}/5
                </Badge>
                {/* Media presence indicators - more prominent */}
                {review.hasImage && (
                  <Badge variant="outline" className="gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <Image className="h-3 w-3" />
                    Images
                  </Badge>
                )}
                {review.hasVideo && (
                  <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                    <Video className="h-3 w-3" />
                    Videos
                  </Badge>
                )}
                {/* No Media badge when there are no images or videos */}
                {!review.hasImage && !review.hasVideo && (
                  <Badge variant="outline" className="gap-1 text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                    <X className="h-3 w-3" />
                    No Media
                  </Badge>
                )}
                <span className="text-sm font-medium">{adjustedConfidence}% confidence</span>
              </div>
              
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
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
            <div className="text-sm">{getConfidenceExplanation()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
