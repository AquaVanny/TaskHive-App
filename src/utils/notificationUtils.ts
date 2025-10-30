import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

/**
 * Schedule a notification for a task deadline
 */
export const scheduleTaskNotification = async (task: {
  id: string;
  title: string;
  due_date: string;
}) => {
  if (!Capacitor.isNativePlatform()) return;

  const dueDate = new Date(task.due_date);
  const now = new Date();
  
  // Don't schedule if the due date is in the past
  if (dueDate < now) return;

  try {
    // Schedule a local notification
    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(task.id.replace(/[^0-9]/g, '').slice(0, 8), 10), // Generate a number ID from the task ID
          title: 'Task Deadline',
          body: `"${task.title}" is due soon!`,
          schedule: { at: dueDate },
          extra: {
            taskId: task.id,
            type: 'task_reminder'
          }
        }
      ]
    });
    
    console.log(`Scheduled notification for task: ${task.title}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

/**
 * Cancel a scheduled notification for a task
 */
export const cancelTaskNotification = async (taskId: string) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const id = parseInt(taskId.replace(/[^0-9]/g, '').slice(0, 8), 10);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Check and schedule notifications for upcoming tasks
 */
export const checkAndScheduleTaskNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Get tasks due in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .gte('due_date', now.toISOString())
      .lte('due_date', tomorrow.toISOString())
      .eq('status', 'pending');

    if (error) throw error;

    // Request notification permissions
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Schedule notifications for each task
    for (const task of tasks || []) {
      await scheduleTaskNotification(task);
    }
  } catch (error) {
    console.error('Error scheduling task notifications:', error);
  }
};
