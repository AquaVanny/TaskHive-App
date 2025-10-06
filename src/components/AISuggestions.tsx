import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { aiService, TaskSuggestion, HabitRecommendation } from '@/services/aiService';
import { useToast } from '@/components/ui/use-toast';

interface AISuggestionsProps {
  type: 'tasks' | 'habits';
  context?: string;
  existingData?: any[];
  onAdd?: (item: any) => void;
}

export const AISuggestions = ({ type, context, existingData, onAdd }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[] | HabitRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      if (type === 'tasks') {
        const data = await aiService.getTaskSuggestions(context, existingData);
        setSuggestions(data);
      } else {
        const data = await aiService.getHabitRecommendations(context, existingData);
        setSuggestions(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: any) => {
    if (onAdd) {
      onAdd(item);
      toast({
        title: "Added",
        description: `${type === 'tasks' ? 'Task' : 'Habit'} added successfully`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI {type === 'tasks' ? 'Task Suggestions' : 'Habit Recommendations'}
            </CardTitle>
            <CardDescription>
              Get personalized {type === 'tasks' ? 'task' : 'habit'} suggestions powered by AI
            </CardDescription>
          </div>
          <Button onClick={generateSuggestions} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Suggestions
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {suggestions.length > 0 && (
        <CardContent className="space-y-4">
          {suggestions.map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {'title' in item ? item.title : item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                  {'benefit' in item && (
                    <p className="text-sm text-primary mt-2">✨ {item.benefit}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {'priority' in item ? item.priority : item.frequency}
                    </span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                {onAdd && (
                  <Button size="sm" variant="ghost" onClick={() => handleAdd(item)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};
