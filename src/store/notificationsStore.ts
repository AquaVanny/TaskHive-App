import { create } from 'zustand';
import { notificationService, Notification } from '@/services/notificationService';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId: string) => {
    set({ loading: true });
    try {
      const data = await notificationService.getNotifications(userId);
      const unreadCount = data.filter((n) => !n.read).length;
      set({ notifications: data, unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      set({
        notifications: get().notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await notificationService.markAllAsRead(userId);
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  subscribeToNotifications: (userId: string) => {
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (notification) => {
        set({
          notifications: [notification, ...get().notifications],
          unreadCount: get().unreadCount + 1,
        });

        // Show browser notification
        notificationService.sendBrowserNotification(notification.message, {
          body: notification.message,
          tag: notification.id,
        });
      }
    );

    return unsubscribe;
  },
}));
