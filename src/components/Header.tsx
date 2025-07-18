
import { Shield, Info, Library, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <a 
                href="/" 
                className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                ReviewGuard
              </a>
              <p className="text-sm text-muted-foreground font-medium">AI-Powered Review Analysis</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
              <a href="/">
                <Shield className="h-4 w-4 mr-2" />
                Authenticate
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
              <a href="/library">
                <Library className="h-4 w-4 mr-2" />
                Library
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
              <a href="/qa">
                <Brain className="h-4 w-4 mr-2" />
                Q&A Training
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
              <a href="/how-it-works">
                <Info className="h-4 w-4 mr-2" />
                How it works
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
