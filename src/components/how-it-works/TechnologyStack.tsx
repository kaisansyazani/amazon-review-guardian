
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Technology {
  name: string;
  purpose: string;
  color: string;
}

interface TechnologyStackProps {
  technologies: Technology[];
}

export const TechnologyStack = ({ technologies }: TechnologyStackProps) => {
  return (
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
  );
};
