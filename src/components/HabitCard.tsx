import { CheckCircle2, Circle, Flame, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];

interface HabitCardProps {
  habit: Habit;
  streak: number;
  isCompletedToday: boolean;
  onComplete: (habitId: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

const frequencyColors = {
  daily: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  weekly: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  monthly: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export const HabitCard = ({
  habit,
  streak,
  isCompletedToday,
  onComplete,
  onEdit,
  onDelete,
}: HabitCardProps) => {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onComplete(habit.id)}
            className={cn(
              'mt-0.5 transition-colors',
              isCompletedToday ? 'text-emerald-500' : 'text-muted-foreground'
            )}
            disabled={isCompletedToday}
          >
            {isCompletedToday ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{habit.name}</h3>

            {habit.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {habit.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {habit.frequency && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', frequencyColors[habit.frequency as keyof typeof frequencyColors])}
                >
                  {habit.frequency}
                </Badge>
              )}

              {habit.category && (
                <Badge variant="secondary" className="text-xs">
                  {habit.category}
                </Badge>
              )}

              {streak > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                  <Flame className="h-3 w-3" />
                  {streak} day streak
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(habit)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(habit.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
