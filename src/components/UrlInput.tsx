import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
}

export const UrlInput = ({ onAnalyze }: UrlInputProps) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateAmazonUrl = (inputUrl: string) => {
    const amazonRegex = /^https?:\/\/(www\.)?amazon\.(com|co\.uk|de|fr|it|es|ca|in|jp|com\.au|com\.mx|com\.br|cn|sg|ae|sa|nl|se|pl|tr|eg)\/.*\/dp\/[A-Z0-9]{10}/i;
    return amazonRegex.test(inputUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter an Amazon product URL");
      return;
    }

    if (!validateAmazonUrl(url)) {
      setError("Please enter a valid Amazon product URL (must contain /dp/ with product ID)");
      return;
    }

    onAnalyze(url);
  };

  return (
    <Card className="shadow-analysis animate-slide-up">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="amazon-url" className="text-sm font-medium">
              Amazon Product URL
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="amazon-url"
                type="url"
                placeholder="https://www.amazon.com/product-name/dp/B00XXXXXXX"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-11 py-6 text-base"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full py-6 text-base font-medium">
            <Search className="h-5 w-5 mr-2" />
            Analyze Reviews
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Our AI will analyze all reviews to detect fake, paid, and malicious content</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};