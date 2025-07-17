
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, Brain, Shield, BarChart3, Search, AlertTriangle } from "lucide-react";

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
                <Card key={index} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      {step.icon}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {step.details.map((detail, detailIndex) => (
                        <Badge key={detailIndex} variant="secondary" className="text-xs">
                          {detail}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  {index < steps.length - 1 && (
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                      <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Technology Stack</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technologies.map((tech, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`bg-${tech.color}-100 text-${tech.color}-700 dark:bg-${tech.color}-900/20`}>
                        {tech.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{tech.purpose}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardHeader>
              <CardTitle>Why Trust ReviewGuard?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">Multi-Source Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    Cross-references data from multiple marketplaces and similar products for comprehensive analysis.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400">Advanced AI Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses state-of-the-art NLP and pattern recognition to identify sophisticated fraud attempts.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400">Real-time Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Processes the most recent reviews and current market data for up-to-date insights.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">Transparent Scoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Provides detailed explanations for all trust scores and fraud risk assessments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
