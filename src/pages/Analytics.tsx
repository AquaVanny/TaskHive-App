import { useEffect, useState } from 'react';
import { useTasksStore } from '@/store/tasksStore';
import { useHabitsStore } from '@/store/habitsStore';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { HabitHeatmap } from '@/components/charts/HabitHeatmap';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfDay } from 'date-fns';

const Analytics = () => {
  const { tasks, fetchTasks } = useTasksStore();
  const { habits, completions, fetchHabits, fetchCompletions } = useHabitsStore();
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchTasks();
    fetchHabits();
    fetchCompletions();
  }, [fetchTasks, fetchHabits, fetchCompletions]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeHabits = habits.length;
  const totalCompletions = completions.length;

  // Generate chart data for tasks
  const days = parseInt(period);
  const chartData = Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const dateStr = format(date, 'MMM dd');
    
    const dayTasks = tasks.filter(t => {
      const taskDate = startOfDay(new Date(t.created_at));
      return taskDate.getTime() === date.getTime();
    });
    
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    
    return {
      date: dateStr,
      completed,
      total: dayTasks.length,
    };
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">View your productivity insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Achievement Badges */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AchievementBadge type="tasks" count={completedTasks} label="Tasks Completed" />
        <AchievementBadge type="habits" count={activeHabits} label="Active Habits" />
        <AchievementBadge type="streak" count={totalCompletions} label="Habit Completions" />
        <AchievementBadge type="team" count={completionRate} label="Completion Rate %" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProgressChart 
          data={chartData}
          title="Task Completion Trend"
          description={`Your progress over the last ${period} days`}
        />
        
        {habits[0] && (
          <HabitHeatmap 
            completions={completions}
            title="Habit Activity"
          />
        )}
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Summary</CardTitle>
          <CardDescription>Detailed breakdown of your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed Tasks</div>
              <div className="text-2xl font-bold text-primary">{completedTasks}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pending Tasks</div>
              <div className="text-2xl font-bold">{totalTasks - completedTasks}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
