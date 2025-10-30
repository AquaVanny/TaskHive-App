import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Target, Users, TrendingUp, Bell } from 'lucide-react';
import { useTasksStore } from '@/store/tasksStore';
import { useHabitsStore } from '@/store/habitsStore';
import { useAuthStore } from '@/store/authStore';
import { TaskCard } from '@/components/TaskCard';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCapacitorNotifications } from '@/hooks/useCapacitorNotifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, fetchTasks, toggleTaskStatus, deleteTask, setupRealtimeSubscription, cleanupRealtimeSubscription } = useTasksStore();
  const { habits, completions, fetchHabits, fetchCompletions, getHabitStreak } = useHabitsStore();
  const { toast } = useToast();
  
  const [greeting, setGreeting] = useState('');
  const { permissionStatus, requestPermission, isInitialized } = useCapacitorNotifications();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchHabits();
    fetchCompletions();
    setupRealtimeSubscription();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Notification permission is now handled by useCapacitorNotifications
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [fetchTasks, fetchHabits, fetchCompletions, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  const handleRequestNotification = async () => {
    if (isRequestingPermission) return;
    
    try {
      setIsRequestingPermission(true);
      const result = await requestPermission();
      
      if (result === 'granted') {
        // Success - the hook will handle the state update
      } else if (result === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your device settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const todayTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const activeStreaks = habits.reduce((total, habit) => {
    const streak = getHabitStreak(habit.id);
    return total + (streak > 0 ? 1 : 0);
  }, 0);

  return (
    <div className="container py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {greeting}, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">{completedTasks} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habits.length}</div>
            <p className="text-xs text-muted-foreground">{activeStreaks} with streaks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Tasks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                  onDelete={deleteTask}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks due today. Great job staying on top of things!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completions.slice(0, 5).map((completion) => {
              const habit = habits.find((h) => h.id === completion.habit_id);
              return (
                <div key={completion.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="flex-1">
                    Completed <span className="font-medium">{habit?.name}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(completion.completed_at), 'h:mm a')}
                  </span>
                </div>
              );
            })}
            {completions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
