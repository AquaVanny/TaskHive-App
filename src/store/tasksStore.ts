import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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
      
      set({ tasks: [data, ...get().tasks] });
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
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
    await get().updateTask(id, { status: newStatus });
  },
}));
