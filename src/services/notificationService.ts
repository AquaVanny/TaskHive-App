export const notificationService = {
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
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/favicon.ico',
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
  }
};
