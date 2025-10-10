import { supabase } from '@/integrations/supabase/client';

export interface TaskReminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_sent: boolean;
  reminder_scheduled_at: string;
  created_at: string;
  updated_at: string;
}

export const reminderService = {
  async scheduleReminder(taskId: string, userId: string, dueDate: Date): Promise<TaskReminder | null> {
    try {
      const now = new Date();
      const timeDiff = dueDate.getTime() - now.getTime();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

      // Calculate reminder time (30 minutes before due date)
      let reminderTime: Date;
      
      if (timeDiff <= 0) {
        // Task is overdue, don't schedule reminder
        console.log('Task is overdue, skipping reminder');
        return null;
      } else if (timeDiff < thirtyMinutes) {
        // Less than 30 minutes until due, schedule immediately (within 2 minutes)
        reminderTime = new Date(now.getTime() + 2 * 60 * 1000);
      } else {
        // Schedule for 30 minutes before due date
        reminderTime = new Date(dueDate.getTime() - thirtyMinutes);
      }

      // Delete any existing reminders for this task to prevent duplicates
      await supabase
        .from('task_reminders')
        .delete()
        .eq('task_id', taskId);

      // Create new reminder
      const { data, error } = await supabase
        .from('task_reminders')
        .insert({
          task_id: taskId,
          user_id: userId,
          reminder_scheduled_at: reminderTime.toISOString(),
          reminder_sent: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Reminder scheduled for:', reminderTime.toISOString());
      return data as TaskReminder;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  },

  async cancelReminder(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_reminders')
        .delete()
        .eq('task_id', taskId);

      if (error) throw error;
      console.log('Reminder cancelled for task:', taskId);
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      throw error;
    }
  },

  async getRemindersForTask(taskId: string): Promise<TaskReminder[]> {
    try {
      const { data, error } = await supabase
        .from('task_reminders')
        .select('*')
        .eq('task_id', taskId)
        .eq('reminder_sent', false);

      if (error) throw error;
      return data as TaskReminder[];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },
};