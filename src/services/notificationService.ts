import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'task_reminder' | 'member_added' | 'member_removed';
  organization_id?: string;
  task_id?: string;
  created_at: string;
  read: boolean;
}

export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for more reliable notifications
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          ...options,
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        ...options,
      });
    }
  },

  scheduleTaskReminder(taskTitle: string, dueDate: Date): void {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    
    // Notify 1 hour before
    const reminderTime = timeDiff - (60 * 60 * 1000);
    
    if (reminderTime > 0) {
      setTimeout(() => {
        this.sendNotification('Task Reminder', {
          body: `"${taskTitle}" is due in 1 hour`,
          tag: `task-${taskTitle}`,
        });
      }, reminderTime);
    }
  },

  scheduleHabitReminder(habitName: string, reminderTime: string): void {
    const now = new Date();
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    let timeDiff = reminderDate.getTime() - now.getTime();
    
    // If time has passed today, schedule for tomorrow
    if (timeDiff < 0) {
      timeDiff += 24 * 60 * 60 * 1000;
    }
    
    setTimeout(() => {
      this.sendNotification('Habit Reminder', {
        body: `Time to complete: ${habitName}`,
        tag: `habit-${habitName}`,
      });
    }, timeDiff);
  },

  // New: Send notification for task events
  async notifyTaskCreated(taskTitle: string): Promise<void> {
    await this.sendNotification('Task Created', {
      body: `New task: "${taskTitle}"`,
      icon: '/favicon.ico',
    });
  },

  async notifyTaskAssigned(taskTitle: string, assignedTo: string): Promise<void> {
    await this.sendNotification('Task Assigned', {
      body: `You've been assigned: "${taskTitle}"`,
      icon: '/favicon.ico',
    });
  },

  async notifyTaskCompleted(taskTitle: string): Promise<void> {
    await this.sendNotification('Task Completed! 🎉', {
      body: `Great job completing: "${taskTitle}"`,
      icon: '/favicon.ico',
    });
  },

  async notifyHabitCompleted(habitName: string, streak: number): Promise<void> {
    await this.sendNotification('Habit Completed! 🔥', {
      body: `${habitName} - ${streak} day streak!`,
      icon: '/favicon.ico',
    });
  },

  async sendBrowserNotification(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  },
};
