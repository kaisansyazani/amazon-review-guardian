import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Search, Shield } from "lucide-react";

interface AnalysisProgressProps {
  progress: number;
  currentStep: string;
}

export const AnalysisProgress = ({ progress, currentStep }: AnalysisProgressProps) => {
  return (
    <Card className="shadow-analysis animate-slide-up">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-4 bg-gradient-primary rounded-full">
                <Brain className="h-8 w-8 text-white animate-pulse-trust" />
              </div>
              <div className="absolute -inset-1 bg-gradient-primary rounded-full opacity-30 animate-ping"></div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Analyzing Reviews</h3>
            <p className="text-muted-foreground">
              Our AI is examining reviews for patterns of deception...
            </p>
          </div>

          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">{currentStep}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-xs text-center">Linguistic Analysis</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-xs text-center">Pattern Detection</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs text-center">Trust Scoring</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};