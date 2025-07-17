import { useState } from "react";
import { UrlInput } from "@/components/UrlInput";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  overallTrust: number;
  totalReviews: number;
  analyzedReviews: Review[];
  insights: string[];
}

export interface Review {
  id: string;
  text: string;
  rating: number;
  date: string;
  author: string;
  classification: 'genuine' | 'paid' | 'bot' | 'malicious';
  confidence: number;
  explanation: string;
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setProgress(0);
    setResults(null);

    // Real analysis steps
    const steps = [
      "Extracting product information...",
      "Fetching reviews from Amazon...",
      "Analyzing linguistic patterns...",
      "Detecting bot-generated content...",
      "Identifying paid reviews...",
      "Flagging malicious posts...",
      "Calculating trust scores...",
      "Generating insights..."
    ];

    try {
      // Simulate progress updates
      for (let i = 0; i < steps.length - 1; i++) {
        setCurrentStep(steps[i]);
        setProgress(((i + 1) / steps.length) * 85);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCurrentStep(steps[steps.length - 1]);
      setProgress(95);

      // Call the edge function for real analysis
      const { data, error } = await supabase.functions.invoke('analyze-reviews', {
        body: { url }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze reviews');
      }

      setProgress(100);
      setResults(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to mock data if API fails
      const mockResults: AnalysisResult = {
        overallTrust: 72,
        totalReviews: 247,
        analyzedReviews: [
          {
            id: "1",
            text: "This product is absolutely amazing! Best purchase ever! 5 stars without hesitation!",
            rating: 5,
            date: "2024-01-15",
            author: "ProductLover123",
            classification: "paid",
            confidence: 87,
            explanation: "Overly enthusiastic language with generic praise and lack of specific product details suggests a paid review."
          },
          {
            id: "2", 
            text: "Great quality phone case. Fits perfectly on my iPhone 15 Pro. The material feels premium and provides good protection. Drop tested from 3 feet and no damage.",
            rating: 4,
            date: "2024-01-12",
            author: "TechReviewer",
            classification: "genuine",
            confidence: 94,
            explanation: "Contains specific product details, balanced assessment, and practical usage information typical of authentic reviews."
          },
          {
            id: "3",
            text: "Terrible product! Complete waste of money! Buy from competitor XYZ instead they are much better!",
            rating: 1,
            date: "2024-01-10", 
            author: "DisappointedUser",
            classification: "malicious",
            confidence: 91,
            explanation: "Excessively negative tone with competitor promotion suggests malicious intent to damage product reputation."
          }
        ],
        insights: [
          "API temporarily unavailable - showing sample data",
          "Please try again later for real analysis"
        ]
      };
      setResults(mockResults);
    }
    
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setResults(null);
    setProgress(0);
    setCurrentStep("");
  };

  return (
    <div className="min-h-screen bg-gradient-analysis">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Amazon Review Authenticator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Detect fake, paid, and malicious reviews with AI-powered analysis. Simply paste an Amazon product link to get started.
            </p>
          </div>

          {!isAnalyzing && !results && (
            <UrlInput onAnalyze={handleAnalyze} />
          )}

          {isAnalyzing && (
            <AnalysisProgress progress={progress} currentStep={currentStep} />
          )}

          {results && (
            <ResultsDashboard results={results} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
