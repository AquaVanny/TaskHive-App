import { useEffect, useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { useTasksStore } from '@/store/tasksStore';
import { useAuthStore } from '@/store/authStore';
import { TaskCard } from '@/components/TaskCard';
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

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const Tasks = () => {
  const { user } = useAuthStore();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus } = useTasksStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (editingTask) {
      setValue('title', editingTask.title);
      setValue('description', editingTask.description || '');
      setValue('priority', editingTask.priority);
      setValue('category', editingTask.category || '');
      setValue('due_date', editingTask.due_date ? editingTask.due_date.split('T')[0] : '');
    } else {
      reset();
    }
  }, [editingTask, setValue, reset]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'personal') return matchesSearch && !task.organization_id;
    return matchesSearch && task.status === activeFilter;
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          ...data,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        });
        toast({ title: 'Task updated successfully' });
      } else {
        const newTask = await createTask({
          ...data,
          user_id: user?.id,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        });
        
        if (newTask) {
          toast({ title: 'Task created successfully' });
        }
      }
      setIsDialogOpen(false);
      setEditingTask(null);
      reset();
    } catch (error) {
      toast({ title: 'Error saving task', variant: 'destructive' });
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast({ title: 'Task deleted successfully' });
    } catch (error) {
      toast({ title: 'Error deleting task', variant: 'destructive' });
    }
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleAddSuggestion = async (suggestion: any) => {
    if (!user) return;
    try {
      const newTask = await createTask({
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        category: suggestion.category,
        status: 'pending',
        user_id: user.id,
      });
      
      if (newTask) {
        toast({
          title: "Task Created",
          description: `"${suggestion.title}" has been added to your tasks`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  if (loading && tasks.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-1">Manage and organize your tasks</p>
      </div>

      <AISuggestions 
        type="tasks" 
        context="Help me stay productive" 
        existingData={tasks}
        onAdd={handleAddSuggestion}
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
          placeholder="Search tasks..."
        />
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTaskStatus}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first task to get started'
          }
          actionLabel={!searchQuery ? 'Create Task' : undefined}
          onAction={!searchQuery ? handleCreateNew : undefined}
        />
      )}

      <FloatingActionButton onClick={handleCreateNew} label="Create Task" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update your task details' : 'Add a new task to your list'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title', { required: true })} placeholder="Task title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Add details..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => setValue('priority', value)} defaultValue={editingTask?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} placeholder="e.g., Work" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTask ? 'Update' : 'Create'} Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
