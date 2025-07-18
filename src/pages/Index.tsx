
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Header } from "@/components/Header";
import { Loader2, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  overallTrust: number;
  totalReviews: number;
  analyzedReviews: Array<{
    id: string;
    text: string;
    rating: number;
    date: string;
    author: string;
    classification: 'genuine' | 'paid' | 'bot' | 'malicious';
    confidence: number;
    explanation: string;
    sentiment?: string;
    emotionScores?: Record<string, number>;
    hasImage?: boolean;
    hasVideo?: boolean;
    isVerifiedPurchase?: boolean;
  }>;
  insights: string[];
  productName: string;
  sentimentScore: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  emotionScores: Record<string, number>;
  topics: Array<{
    name: string;
    frequency: number;
    sentiment: string;
  }>;
  keywords: string[];
  productAspects: Record<string, string>;
  summaryOverall?: string;
  summaryPositive?: string;
  summaryNegative?: string;
  recommendation?: string;
  productContext?: {
    fraudRisk: 'Low' | 'Medium' | 'High';
    priceAnalysis: {
      prices?: Array<{ country: string; price: number; originalPrice: string }>;
      averagePrice: number;
      priceVariation: number;
      suspiciousPricing: boolean;
      marketplacesChecked?: number;
    };
    marketplaceAnalysis: Array<{ country: string; data: any; success: boolean }>;
  };
}

const IndexPage = () => {
  const [productUrl, setProductUrl] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeProduct = async () => {
    setIsLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-reviews', {
        body: { url: productUrl }
      });

      if (error) {
        console.error("Analysis failed:", error);
        alert(`Analysis failed: ${error.message || 'Unknown error'}`);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error("Error during analysis:", error);
      alert("An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setProductUrl("");
  };

  useEffect(() => {
    const storedUrl = localStorage.getItem("productUrl");
    if (storedUrl) {
      setProductUrl(storedUrl);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("productUrl", productUrl);
  }, [productUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      
      <div className="container mx-auto py-16 px-4">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
              <Sparkles className="h-4 w-4" />
              AI-Powered Review Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
              Uncover the Truth in 
              <br />
              Product Reviews
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Advanced AI analysis to detect fake reviews, analyze sentiment, and provide 
              comprehensive insights about Amazon products.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 shadow-analysis border-0 bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Paste Amazon product URL here..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="pl-12 h-14 text-lg border-2 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
                
                <Button 
                  onClick={analyzeProduct} 
                  disabled={isLoading || !productUrl.trim()}
                  className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Reviews...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Analyze Product Reviews
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Results or Placeholder */}
          <div className="max-w-7xl mx-auto">
            {results ? (
              <div className="animate-slide-up">
                <ResultsDashboard results={results} onReset={resetAnalysis} />
              </div>
            ) : (
              <Card className="text-center p-12 shadow-card-custom bg-card/30 backdrop-blur-sm border border-border/50">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Analyzing Product Reviews</h3>
                      <p className="text-muted-foreground">This may take a few moments while we process the data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                      <Search className="h-12 w-12 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Ready to Analyze</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Enter an Amazon product URL above to get started with comprehensive review analysis.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
