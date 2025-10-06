import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { notificationService } from '@/services/notificationService';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface TasksState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (task: TaskInsert) => Promise<Task | null>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string, currentStatus: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: data || [] });
      
      // Set up real-time subscription
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              set((state) => ({
                tasks: [payload.new as Task, ...state.tasks]
              }));
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              set((state) => ({
                tasks: state.tasks.map(t => 
                  t.id === (payload.new as Task).id ? payload.new as Task : t
                )
              }));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              set((state) => ({
                tasks: state.tasks.filter(t => t.id !== (payload.old as Task).id)
              }));
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (task: TaskInsert) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      
      // Optimistically update the state
      set((state) => ({ tasks: [data, ...state.tasks] }));
      
      // Send notification for task creation
      await notificationService.notifyTaskCreated(data.title);
      
      // Schedule reminder if due date exists
      if (data.due_date) {
        notificationService.scheduleTaskReminder(data.title, new Date(data.due_date));
      }
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (id: string, updates: TaskUpdate) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set({
        tasks: get().tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;

      set({ tasks: get().tasks.filter((task) => task.id !== id) });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  toggleTaskStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await get().updateTask(id, { status: newStatus });
      
      // Send notification when task is completed
      if (newStatus === 'completed') {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          await notificationService.notifyTaskCompleted(task.title);
        }
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      throw error;
    }
  },
}));
