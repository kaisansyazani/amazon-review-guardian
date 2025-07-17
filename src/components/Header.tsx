
import { Shield, Github, Info, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <a href="/" className="text-xl font-bold hover:text-primary transition-colors">ReviewGuard</a>
              <p className="text-sm text-muted-foreground">AI-Powered Review Analysis</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <Shield className="h-4 w-4 mr-2" />
                Authenticate
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/library">
                <Library className="h-4 w-4 mr-2" />
                Library
              </a>
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="h-4 w-4 mr-2" />
              How it works
            </Button>
            <Button variant="ghost" size="sm">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
