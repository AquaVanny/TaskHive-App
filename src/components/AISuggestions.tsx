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
        toast({
          title: "Suggestions Generated",
          description: `Generated ${data.length} ${type} suggestions`,
        });
      } else {
        const data = await aiService.getHabitRecommendations(context, existingData);
        setSuggestions(data);
        toast({
          title: "Recommendations Generated",
          description: `Generated ${data.length} ${type} recommendations`,
        });
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
      // Clear the suggestion after adding
      if (type === 'tasks') {
        setSuggestions((prev) => (prev as TaskSuggestion[]).filter((s) => s !== item));
      } else {
        setSuggestions((prev) => (prev as HabitRecommendation[]).filter((s) => s !== item));
      }
      toast({
        title: "Added Successfully",
        description: `${type === 'tasks' ? 'Task' : 'Habit'} added to your list`,
      });
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              AI {type === 'tasks' ? 'Task Suggestions' : 'Habit Recommendations'}
            </CardTitle>
            <CardDescription className="mt-1">
              Get personalized {type === 'tasks' ? 'task' : 'habit'} suggestions powered by AI
            </CardDescription>
          </div>
          <Button 
            onClick={generateSuggestions} 
            disabled={loading}
            className="w-full md:w-auto"
            size="default"
          >
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
        <CardContent className="space-y-3">
          {suggestions.map((item, idx) => (
            <div 
              key={idx} 
              className="group p-4 border rounded-lg hover:border-primary/40 hover:bg-accent/5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-base">
                    {'title' in item ? item.title : item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  {'benefit' in item && (
                    <p className="text-sm text-primary font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {item.benefit}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {'priority' in item ? item.priority : item.frequency}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-secondary rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                {onAdd && (
                  <Button 
                    size="sm" 
                    onClick={() => handleAdd(item)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
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
