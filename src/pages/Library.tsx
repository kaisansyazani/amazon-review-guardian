import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScore } from "@/components/TrustScore";
import { Header } from "@/components/Header";
import { DetailedAnalysisView } from "@/components/DetailedAnalysisView";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Use the database type directly but transform analyzed_reviews to proper array type
type DatabaseAnalysisResult = Tables<'analysis_results'>;

interface AnalysisResult extends Omit<DatabaseAnalysisResult, 'analyzed_reviews'> {
  analyzed_reviews: any[]; // Transform Json to array type
}

export default function Library() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the database results to match our interface
      const transformedResults = (data || []).map(result => ({
        ...result,
        analyzed_reviews: Array.isArray(result.analyzed_reviews) 
          ? result.analyzed_reviews 
          : []
      })) as AnalysisResult[];
      
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load library",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAmazonUrl = (asin: string) => {
    return `https://www.amazon.com/dp/${asin}`;
  };

  const handleCardClick = (result: AnalysisResult) => {
    setSelectedResult(result);
  };

  const handleBackToLibrary = () => {
    setSelectedResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show detailed analysis if a result is selected
  if (selectedResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <DetailedAnalysisView 
            result={selectedResult} 
            onBack={handleBackToLibrary}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Authentication Library</h1>
          <p className="text-muted-foreground text-lg">
            All your authenticated Amazon products
          </p>
        </div>

        {results.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No products authenticated yet.</p>
              <Button asChild className="mt-4">
                <a href="/">Start Authenticating</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <Card 
                key={result.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCardClick(result)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{result.product_name || 'Unknown Product'}</CardTitle>
                      <CardDescription className="text-sm font-mono">{result.asin}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a 
                        href={generateAmazonUrl(result.asin)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <CardDescription>
                    Analyzed on {new Date(result.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TrustScore score={result.overall_trust} totalReviews={result.total_reviews} />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Reviews:</span>
                    <Badge variant="secondary">{result.total_reviews}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Key Insights:</h4>
                    <div className="space-y-1">
                      {result.insights.slice(0, 2).map((insight, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {insight}
                        </p>
                      ))}
                      {result.insights.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{result.insights.length - 2} more insights
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                      Click to view detailed analysis
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
