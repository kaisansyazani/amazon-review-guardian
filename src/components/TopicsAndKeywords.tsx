import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagIcon, Hash, TrendingUp, TrendingDown } from "lucide-react";

interface TopicsAndKeywordsProps {
  topics: Array<{
    name: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  keywords: string[];
  productAspects: {
    [key: string]: string;
  };
}

export const TopicsAndKeywords = ({ topics, keywords, productAspects }: TopicsAndKeywordsProps) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const getAspectColor = (sentiment: string) => {
    if (sentiment?.toLowerCase().includes('positive') || sentiment?.toLowerCase().includes('good') || sentiment?.toLowerCase().includes('excellent')) {
      return 'text-green-600';
    }
    if (sentiment?.toLowerCase().includes('negative') || sentiment?.toLowerCase().includes('bad') || sentiment?.toLowerCase().includes('poor')) {
      return 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Topics & Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topics && topics.length > 0 ? (
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSentimentColor(topic.sentiment)}>
                      {getSentimentIcon(topic.sentiment)}
                      <span className="ml-1">{topic.name}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mentioned {topic.frequency} times
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No topics extracted yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Key Phrases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywords && keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No keywords extracted yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Product Aspects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Aspects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productAspects && Object.keys(productAspects).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(productAspects).map(([aspect, sentiment], index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="font-medium capitalize">{aspect}</div>
                  <div className={`text-sm ${getAspectColor(sentiment)}`}>
                    {sentiment}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No product aspects analyzed yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};