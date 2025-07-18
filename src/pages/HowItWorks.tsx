
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Database, Brain, AlertTriangle, BarChart3, Shield } from "lucide-react";
import { WorkflowStep } from "@/components/how-it-works/WorkflowStep";
import { TechnologyStack } from "@/components/how-it-works/TechnologyStack";
import { TrustReasons } from "@/components/how-it-works/TrustReasons";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "1. Product URL Input",
      description: "User enters an Amazon product URL",
      details: [
        "ASIN extraction from URL",
        "Product validation",
        "Initial metadata collection"
      ]
    },
    {
      icon: <Database className="h-8 w-8 text-blue-500" />,
      title: "2. Data Collection",
      description: "Multi-source data gathering using RapidAPI",
      details: [
        "Product details & specifications",
        "Recent reviews (up to 15 per analysis)",
        "Cross-marketplace price comparison (US, UK, DE, CA, FR)",
        "Similar products identification",
        "Rating distribution analysis"
      ]
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: "3. AI Analysis",
      description: "Advanced ML processing of collected data",
      details: [
        "Sentiment analysis using NLP",
        "Review authenticity classification",
        "Emotional tone detection",
        "Pattern recognition for bot reviews",
        "Topic modeling and keyword extraction"
      ]
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
      title: "4. Fraud Detection",
      description: "Multi-layered fraud risk assessment",
      details: [
        "Price manipulation detection",
        "Review timing pattern analysis",
        "Cross-marketplace price variance",
        "Suspicious reviewer behavior",
        "Coordinated review campaigns"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      title: "5. Trust Score Calculation",
      description: "Comprehensive trustworthiness rating",
      details: [
        "Weighted scoring algorithm",
        "Review authenticity percentage",
        "Price fairness assessment",
        "Overall recommendation generation",
        "Risk level categorization"
      ]
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "6. Results & Storage",
      description: "Detailed report generation and persistence",
      details: [
        "Interactive dashboard presentation",
        "Detailed review breakdown",
        "Actionable insights and recommendations",
        "Results stored in Supabase for future reference",
        "Historical analysis tracking"
      ]
    }
  ];

  const technologies = [
    { name: "React + TypeScript", purpose: "Frontend Framework", color: "blue" },
    { name: "Supabase", purpose: "Database & Authentication", color: "green" },
    { name: "RapidAPI", purpose: "Amazon Data Source", color: "purple" },
    { name: "OpenAI GPT", purpose: "AI Analysis Engine", color: "orange" },
    { name: "Tailwind CSS", purpose: "UI Styling", color: "cyan" },
    { name: "Recharts", purpose: "Data Visualization", color: "pink" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">How ReviewGuard Works</h1>
            <p className="text-xl text-muted-foreground">
              Understanding our AI-powered review authentication system
            </p>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="text-2xl">System Overview</CardTitle>
              <CardDescription>
                ReviewGuard uses advanced AI and machine learning to analyze Amazon product reviews, 
                detect fraudulent patterns, and provide comprehensive trust scores through multi-source data analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Workflow Steps</h2>
            
            <div className="grid gap-6">
              {steps.map((step, index) => (
                <WorkflowStep 
                  key={index} 
                  step={step} 
                  index={index} 
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>
          </div>

          <TechnologyStack technologies={technologies} />

          <TrustReasons />
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
