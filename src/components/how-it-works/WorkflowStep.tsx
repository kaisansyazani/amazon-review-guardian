
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface WorkflowStepProps {
  step: {
    icon: React.ReactNode;
    title: string;
    description: string;
    details: string[];
  };
  index: number;
  isLast: boolean;
}

export const WorkflowStep = ({ step, index, isLast }: WorkflowStepProps) => {
  return (
    <Card className="relative">
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
      {!isLast && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>
      )}
    </Card>
  );
};
