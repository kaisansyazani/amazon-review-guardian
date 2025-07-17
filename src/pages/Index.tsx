
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: productUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Analysis failed:", errorData);
        alert(`Analysis failed: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Amazon Product Review Analysis</h1>
            <p className="text-muted-foreground">
              Enter an Amazon product URL to analyze its reviews.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="url"
              placeholder="https://www.amazon.com/dp/B07Y899FF9"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />
            <Button onClick={analyzeProduct} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Product"
              )}
            </Button>
          </div>

          {results ? (
            <ResultsDashboard results={results} onReset={resetAnalysis} />
          ) : (
            <Card className="text-center p-6 text-muted-foreground">
              {isLoading ? (
                "Analyzing product reviews, please wait..."
              ) : (
                "Enter a product URL to begin analysis."
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
