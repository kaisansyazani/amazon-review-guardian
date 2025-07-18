
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, DollarSign, Globe, CheckCircle, ShoppingCart, ExternalLink } from "lucide-react";

interface FraudAnalysisProps {
  fraudRisk: 'Low' | 'Medium' | 'High';
  priceAnalysis: {
    prices?: Array<{ country: string; price: number; originalPrice: string; marketplace?: string; url?: string }>;
    averagePrice: number;
    priceVariation: number;
    suspiciousPricing: boolean;
    marketplacesChecked?: number;
    crossMarketplaceAnalysis?: boolean;
  };
  marketplaceAnalysis: Array<{ country: string; data: any; success: boolean; marketplace?: string }>;
}

export const FraudAnalysis = ({ 
  fraudRisk, 
  priceAnalysis, 
  marketplaceAnalysis
}: FraudAnalysisProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return <Shield className="h-5 w-5" />;
      case 'Medium': return <AlertTriangle className="h-5 w-5" />;
      case 'High': return <AlertTriangle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const marketplacesChecked = priceAnalysis.marketplacesChecked || marketplaceAnalysis?.length || 0;
  const amazonMarketplaces = marketplaceAnalysis.filter(m => m.marketplace === 'amazon' || m.country.includes('Amazon')) || [];
  const otherMarketplaces = marketplaceAnalysis.filter(m => m.marketplace === 'other' || !m.country.includes('Amazon')) || [];

  // Enhanced price analysis for comprehensive cross-platform comparison
  const amazonPrices = priceAnalysis.prices?.filter(p => p.marketplace === 'amazon' || p.country.includes('Amazon')) || [];
  const similarProductPrices = priceAnalysis.prices?.filter(p => p.marketplace === 'other' || (!p.country.includes('Amazon') && !p.marketplace)) || [];
  
  // Calculate comprehensive price statistics across ALL sources (Amazon + Similar Products)
  const allPriceValues = priceAnalysis.prices?.map(p => p.price).filter(p => p > 0) || [];
  const amazonPriceValues = amazonPrices.map(p => p.price).filter(p => p > 0);
  const similarPriceValues = similarProductPrices.map(p => p.price).filter(p => p > 0);
  
  // Comprehensive price variation calculation
  const comprehensiveMinPrice = allPriceValues.length > 0 ? Math.min(...allPriceValues) : 0;
  const comprehensiveMaxPrice = allPriceValues.length > 0 ? Math.max(...allPriceValues) : 0;
  const comprehensiveAvgPrice = allPriceValues.length > 0 ? allPriceValues.reduce((sum, p) => sum + p, 0) / allPriceValues.length : 0;
  const comprehensivePriceVariation = allPriceValues.length > 1 ? ((comprehensiveMaxPrice - comprehensiveMinPrice) / comprehensiveAvgPrice) * 100 : 0;
  
  // Amazon-only price statistics
  const amazonMinPrice = amazonPriceValues.length > 0 ? Math.min(...amazonPriceValues) : 0;
  const amazonMaxPrice = amazonPriceValues.length > 0 ? Math.max(...amazonPriceValues) : 0;
  const amazonAvgPrice = amazonPriceValues.length > 0 ? amazonPriceValues.reduce((sum, p) => sum + p, 0) / amazonPriceValues.length : 0;
  const amazonPriceVariation = amazonPriceValues.length > 1 ? ((amazonMaxPrice - amazonMinPrice) / amazonAvgPrice) * 100 : 0;
  
  // Enhanced suspicious pricing detection using comprehensive data
  const isSuspiciousComprehensivePricing = comprehensivePriceVariation > 40; // More than 40% variation across all sources
  const isSuspiciousAmazonPricing = amazonPriceVariation > 30; // More than 30% variation across Amazon marketplaces
  
  let comparisonWithSimilarProducts = '';
  if (similarPriceValues.length > 0 && amazonPriceValues.length > 0) {
    const similarAvgPrice = similarPriceValues.reduce((sum, p) => sum + p, 0) / similarPriceValues.length;
    const priceDifferenceVsSimilar = ((amazonAvgPrice - similarAvgPrice) / similarAvgPrice) * 100;
    
    if (Math.abs(priceDifferenceVsSimilar) > 40) {
      comparisonWithSimilarProducts = `${priceDifferenceVsSimilar > 0 ? 'Significantly higher' : 'Suspiciously lower'} than similar products (${Math.abs(priceDifferenceVsSimilar).toFixed(1)}% difference)`;
    } else {
      comparisonWithSimilarProducts = `Price consistent with similar products (${Math.abs(priceDifferenceVsSimilar).toFixed(1)}% difference)`;
    }
  }

  // Total sources analyzed (Amazon marketplaces + similar products)
  const totalSourcesAnalyzed = amazonPrices.length + similarProductPrices.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Comprehensive Fraud Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getRiskColor(fraudRisk)}`}>
              {getRiskIcon(fraudRisk)}
              <span className="font-semibold">{fraudRisk} Risk</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">{totalSourcesAnalyzed} Price Sources</div>
                <div className="text-xs text-muted-foreground">
                  {amazonPrices.length} Amazon + {similarProductPrices.length} Similar Products
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">
                  {marketplaceAnalysis.filter(m => m.success).length} Successful Checks
                </div>
                <div className="text-xs text-muted-foreground">Data availability</div>
              </div>
            </div>
          </div>

          {totalSourcesAnalyzed < 3 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Insufficient Price Sources</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Only {totalSourcesAnalyzed} price source(s) analyzed. For reliable fraud detection, at least 3 sources must be compared. Current analysis may not be comprehensive.
              </p>
            </div>
          )}

          {isSuspiciousComprehensivePricing && totalSourcesAnalyzed >= 3 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Suspicious Cross-Platform Pricing Detected</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Price variation of {comprehensivePriceVariation.toFixed(1)}% across all sources (${comprehensiveMinPrice.toFixed(2)} - ${comprehensiveMaxPrice.toFixed(2)}). 
                Such significant differences across Amazon marketplaces and similar products may indicate pricing manipulation or fraudulent activity.
              </p>
            </div>
          )}

          {isSuspiciousAmazonPricing && amazonPrices.length >= 2 && !isSuspiciousComprehensivePricing && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Amazon Marketplace Price Variation</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Price variation of {amazonPriceVariation.toFixed(1)}% across Amazon marketplaces (${amazonMinPrice.toFixed(2)} - ${amazonMaxPrice.toFixed(2)}). 
                Moderate variation detected within Amazon's ecosystem.
              </p>
            </div>
          )}

          {totalSourcesAnalyzed >= 3 && !isSuspiciousComprehensivePricing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Comprehensive Cross-Platform Analysis</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Analysis includes {totalSourcesAnalyzed} price sources: {amazonPrices.length} Amazon marketplaces and {similarProductPrices.length} similar products. 
                Overall price variation: {comprehensivePriceVariation.toFixed(1)}% (acceptable range for comprehensive fraud detection).
              </p>
            </div>
          )}

          {comparisonWithSimilarProducts && (
            <div className={`p-3 rounded-lg border ${comparisonWithSimilarProducts.includes('Suspiciously') || comparisonWithSimilarProducts.includes('Significantly') ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`flex items-center gap-2 ${comparisonWithSimilarProducts.includes('Suspiciously') || comparisonWithSimilarProducts.includes('Significantly') ? 'text-yellow-800' : 'text-green-800'}`}>
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Similar Product Comparison</span>
              </div>
              <p className={`text-xs mt-1 ${comparisonWithSimilarProducts.includes('Suspiciously') || comparisonWithSimilarProducts.includes('Significantly') ? 'text-yellow-700' : 'text-green-700'}`}>
                {comparisonWithSimilarProducts} (analyzed {similarProductPrices.length} similar products)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cross-Platform Pricing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">${comprehensiveAvgPrice?.toFixed(2) || 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Average Price (All Sources)</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{comprehensivePriceVariation?.toFixed(1) || 0}%</div>
              <div className="text-xs text-muted-foreground">Overall Price Variation</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{totalSourcesAnalyzed}</div>
              <div className="text-xs text-muted-foreground">Total Price Sources</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Badge variant={isSuspiciousComprehensivePricing ? "destructive" : "secondary"}>
                {isSuspiciousComprehensivePricing ? "Suspicious" : "Normal"}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Cross-Platform Pattern</div>
            </div>
          </div>

          {amazonPrices.length >= 2 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Amazon Marketplace Prices:
                <Badge variant={isSuspiciousAmazonPricing ? "destructive" : "secondary"} className="text-xs">
                  {amazonPriceVariation.toFixed(1)}% variation
                </Badge>
              </h4>
              <div className="space-y-2">
                {amazonPrices.map((price, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">{price.country}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-sm font-bold">${price.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{price.originalPrice}</div>
                      </div>
                      {price.url && (
                        <a 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors p-1 hover:bg-muted rounded"
                          title={`View product on ${price.country}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {similarProductPrices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Similar Products for Comparison:</h4>
              <div className="space-y-2">
                {similarProductPrices.map((price, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{price.country}</span>
                      <Badge variant="outline" className="text-xs">Similar Product</Badge>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-sm font-bold">${price.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{price.originalPrice}</div>
                      </div>
                      {price.url && (
                        <a 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors p-1 hover:bg-muted rounded"
                          title="View similar product"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketplaceAnalysis && marketplaceAnalysis.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Marketplace Availability:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {marketplaceAnalysis.map((market, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border">
                    <div className={`h-2 w-2 rounded-full ${market.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs flex-1">{market.country}</span>
                    {!(market.marketplace === 'amazon' || market.country.includes('Amazon')) && (
                      <Badge variant="outline" className="text-xs px-1 py-0">Other</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {market.success ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
