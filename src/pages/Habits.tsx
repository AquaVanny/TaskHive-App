import { useEffect, useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { useHabitsStore } from '@/store/habitsStore';
import { useAuthStore } from '@/store/authStore';
import { HabitCard } from '@/components/HabitCard';
import { FilterBar } from '@/components/FilterBar';
import { SearchInput } from '@/components/SearchInput';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EmptyState } from '@/components/EmptyState';
import { AISuggestions } from '@/components/AISuggestions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/Loading';
import { startOfDay } from 'date-fns';

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const Habits = () => {
  const { user } = useAuthStore();
  const {
    habits,
    completions,
    loading,
    fetchHabits,
    fetchCompletions,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    getHabitStreak,
  } = useHabitsStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    fetchHabits();
    fetchCompletions();
  }, [fetchHabits, fetchCompletions]);

  useEffect(() => {
    if (editingHabit) {
      setValue('name', editingHabit.name);
      setValue('description', editingHabit.description || '');
      setValue('frequency', editingHabit.frequency);
      setValue('category', editingHabit.category || '');
    } else {
      reset();
    }
  }, [editingHabit, setValue, reset]);

  const isCompletedToday = (habitId: string) => {
    const today = startOfDay(new Date());
    return completions.some((completion) => {
      const completionDate = startOfDay(new Date(completion.completed_at));
      return completion.habit_id === habitId && completionDate.getTime() === today.getTime();
    });
  };

  const filteredHabits = habits.filter((habit) => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && habit.frequency === activeFilter;
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
        toast({ title: 'Habit updated successfully' });
      } else {
        await createHabit({
          ...data,
          user_id: user?.id,
        });
        toast({ title: 'Habit created successfully' });
      }
      setIsDialogOpen(false);
      setEditingHabit(null);
      reset();
    } catch (error) {
      toast({ title: 'Error saving habit', variant: 'destructive' });
    }
  };

  const handleComplete = async (habitId: string) => {
    try {
      await completeHabit(habitId);
      toast({ title: 'Habit completed! 🎉' });
    } catch (error) {
      toast({ title: 'Error completing habit', variant: 'destructive' });
    }
  };

  const handleEdit = (habit: any) => {
    setEditingHabit(habit);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit(id);
      toast({ title: 'Habit deleted successfully' });
    } catch (error) {
      toast({ title: 'Error deleting habit', variant: 'destructive' });
    }
  };

  const handleCreateNew = () => {
    setEditingHabit(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleAddRecommendation = async (recommendation: any) => {
    if (!user) return;
    await createHabit({
      name: recommendation.name,
      description: recommendation.description,
      frequency: recommendation.frequency,
      category: recommendation.category,
      user_id: user.id,
    });
    fetchHabits();
  };

  if (loading && habits.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Habits</h1>
        <p className="text-muted-foreground mt-1">Build and track your daily habits</p>
      </div>

      <AISuggestions 
        type="habits" 
        context="Help me build better habits" 
        existingData={habits}
        onAdd={handleAddRecommendation}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterBar
          options={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search habits..."
        />
      </div>

      {filteredHabits.length > 0 ? (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              streak={getHabitStreak(habit.id)}
              isCompletedToday={isCompletedToday(habit.id)}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No habits found"
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first habit to start building consistency'
          }
          actionLabel={!searchQuery ? 'Create Habit' : undefined}
          onAction={!searchQuery ? handleCreateNew : undefined}
        />
      )}

      <FloatingActionButton onClick={handleCreateNew} label="Create Habit" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
            <DialogDescription>
              {editingHabit ? 'Update your habit details' : 'Add a new habit to track'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name', { required: true })} placeholder="Habit name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="What's this habit about?" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select onValueChange={(value) => setValue('frequency', value)} defaultValue={editingHabit?.frequency || 'daily'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} placeholder="e.g., Health" />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingHabit ? 'Update' : 'Create'} Habit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Habits;
