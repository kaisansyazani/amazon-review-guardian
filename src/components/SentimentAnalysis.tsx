
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Smile, Frown, Meh } from "lucide-react";

interface SentimentAnalysisProps {
  sentimentScore: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  emotionScores: {
    [key: string]: number;
  };
}

export const SentimentAnalysis = ({ 
  sentimentScore, 
  sentimentDistribution, 
  emotionScores 
}: SentimentAnalysisProps) => {
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-600";
    if (score < -0.3) return "text-red-600";
    return "text-yellow-600";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <Smile className="h-6 w-6 text-green-600" />;
    if (score < -0.3) return <Frown className="h-6 w-6 text-red-600" />;
    return <Meh className="h-6 w-6 text-yellow-600" />;
  };

  const pieData = [
    { name: 'Positive', value: sentimentDistribution?.positive || 0, color: '#22c55e' },
    { name: 'Neutral', value: sentimentDistribution?.neutral || 0, color: '#eab308' },
    { name: 'Negative', value: sentimentDistribution?.negative || 0, color: '#ef4444' }
  ];

  const emotionData = Object.entries(emotionScores || {}).map(([emotion, score]) => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    score: score
  }));

  // Check if sentimentScore is a valid number (including 0)
  const isValidSentimentScore = typeof sentimentScore === 'number' && !isNaN(sentimentScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getSentimentIcon(sentimentScore || 0)}
              </div>
              <p className="text-sm text-muted-foreground">Overall Sentiment</p>
              <p className={`text-2xl font-bold ${getSentimentColor(sentimentScore || 0)}`}>
                {isValidSentimentScore ? (sentimentScore > 0 ? '+' : '') + sentimentScore.toFixed(2) : 'N/A'}
              </p>
            </div>
            
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Positive</p>
              <p className="text-lg font-semibold text-green-600">
                {sentimentDistribution?.positive || 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Neutral</p>
              <p className="text-lg font-semibold text-yellow-600">
                {sentimentDistribution?.neutral || 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Negative</p>
              <p className="text-lg font-semibold text-red-600">
                {sentimentDistribution?.negative || 0}%
              </p>
            </div>
          </div>

          {emotionData.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Emotion Breakdown</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
