import { supabase } from '@/integrations/supabase/client';
import { scheduleTaskNotification, cancelTaskNotification } from '@/utils/notificationUtils';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  category?: string;
  user_id: string;
  assigned_to?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export const taskService = {
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async getTaskById(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Task;
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    
    // Schedule notification if due date is set
    if (task.due_date) {
      await scheduleTaskNotification({
        id: data.id,
        title: data.title,
        due_date: data.due_date
      });
    }
    
    return data as Task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Update notification if due date was changed
    if (updates.due_date) {
      // Cancel existing notification
      await cancelTaskNotification(id);
      
      // Schedule new notification if task is not completed
      if (updates.status !== 'completed') {
        await scheduleTaskNotification({
          id: data.id,
          title: data.title,
          due_date: updates.due_date
        });
      }
    }
    
    return data as Task;
  },

  async deleteTask(id: string) {
    // Cancel any scheduled notifications for this task
    await cancelTaskNotification(id);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribeToChanges(callback: (task: Task) => void) {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Task);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
