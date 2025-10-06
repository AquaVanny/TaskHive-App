import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService, ProductivityInsights } from '@/services/aiService';
import { useToast } from '@/components/ui/use-toast';

interface AIInsightsProps {
  tasksData: any;
  habitsData: any;
  timeframe?: string;
}

export const AIInsights = ({ tasksData, habitsData, timeframe = '7 days' }: AIInsightsProps) => {
  const [insights, setInsights] = useState<ProductivityInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      const data = await aiService.getProductivityInsights(tasksData, habitsData, timeframe);
      setInsights(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Productivity Insights
            </CardTitle>
            <CardDescription>Get personalized recommendations powered by AI</CardDescription>
          </div>
          <Button onClick={generateInsights} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {insights && (
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Summary</h4>
            <p className="text-muted-foreground">{insights.summary}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-primary">Your Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {insights.strengths.map((strength, idx) => (
                <li key={idx} className="text-muted-foreground">{strength}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Areas to Improve</h4>
            <ul className="list-disc list-inside space-y-1">
              {insights.improvements.map((improvement, idx) => (
                <li key={idx} className="text-muted-foreground">{improvement}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-1">
              {insights.recommendations.map((rec, idx) => (
                <li key={idx} className="text-muted-foreground">{rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
