
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, DollarSign, Globe, CheckCircle, ShoppingCart } from "lucide-react";

interface FraudAnalysisProps {
  fraudRisk: 'Low' | 'Medium' | 'High';
  priceAnalysis: {
    prices?: Array<{ country: string; price: number; originalPrice: string; marketplace?: string }>;
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
                <div className="text-sm font-medium">{marketplacesChecked} Markets Analyzed</div>
                <div className="text-xs text-muted-foreground">
                  {priceAnalysis.crossMarketplaceAnalysis ? 'Cross-platform analysis' : 'Single marketplace analysis'}
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

          {marketplacesChecked < 3 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Insufficient Marketplace Coverage</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Only {marketplacesChecked} marketplace(s) checked. For reliable fraud detection, at least 3 markets must be analyzed. Current analysis may not be comprehensive.
              </p>
            </div>
          )}

          {marketplacesChecked >= 3 && priceAnalysis.crossMarketplaceAnalysis && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Comprehensive Cross-Platform Analysis</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Analysis includes data from {marketplacesChecked} marketplaces including Amazon ({amazonMarketplaces.filter(m => m.success).length}) and other platforms ({otherMarketplaces.filter(m => m.success).length}) for comprehensive fraud detection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cross-Market Pricing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">${priceAnalysis.averagePrice?.toFixed(2) || 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Average Price</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{priceAnalysis.priceVariation?.toFixed(1) || 0}%</div>
              <div className="text-xs text-muted-foreground">Price Variation</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{marketplacesChecked}</div>
              <div className="text-xs text-muted-foreground">Markets Checked</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Badge variant={priceAnalysis.suspiciousPricing ? "destructive" : "secondary"}>
                {priceAnalysis.suspiciousPricing ? "Suspicious" : "Normal"}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Pricing Pattern</div>
            </div>
          </div>

          {priceAnalysis.prices && priceAnalysis.prices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Price by Marketplace:</h4>
              <div className="space-y-2">
                {priceAnalysis.prices.map((price, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {price.marketplace === 'amazon' || price.country.includes('Amazon') ? (
                        <Globe className="h-4 w-4 text-orange-500" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">{price.country}</span>
                      {!(price.marketplace === 'amazon' || price.country.includes('Amazon')) && (
                        <Badge variant="outline" className="text-xs">Other Platform</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">${price.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{price.originalPrice}</div>
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
