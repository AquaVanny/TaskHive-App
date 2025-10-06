import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface HabitHeatmapProps {
  completions: Array<{ completed_at: string }>;
  title: string;
}

export const HabitHeatmap = ({ completions, title }: HabitHeatmapProps) => {
  const weeks = 12;
  const today = new Date();
  const startDate = startOfWeek(subWeeks(today, weeks - 1));
  const endDate = endOfWeek(today);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const completionMap = new Map(
    completions.map(c => [format(new Date(c.completed_at), 'yyyy-MM-dd'), true])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Last {weeks} weeks activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs text-center text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completionMap.has(dateStr);
            
            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-sm ${
                  isCompleted 
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`}
                title={dateStr}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
