import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class CapacitorNotificationService {
  private static instance: CapacitorNotificationService;
  private isNativePlatform: boolean;

  private constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  static getInstance(): CapacitorNotificationService {
    if (!CapacitorNotificationService.instance) {
      CapacitorNotificationService.instance = new CapacitorNotificationService();
    }
    return CapacitorNotificationService.instance;
  }

  /**
   * Initialize push notifications and request permissions
   * This is what will properly request Android notification permissions!
   */
  async initialize(): Promise<string | null> {
    if (!this.isNativePlatform) {
      console.log('Not running on native platform, skipping native notifications');
      return null;
    }

    try {
      // Request permission to use push notifications
      // This will trigger the Android permission dialog
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        console.log('Push notification permission granted');
        
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
        
        return 'granted';
      } else {
        console.log('Push notification permission denied');
        return 'denied';
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<string> {
    if (!this.isNativePlatform) {
      return 'denied';
    }

    try {
      const permResult = await PushNotifications.checkPermissions();
      return permResult.receive;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return 'denied';
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onRegistration?: (token: Token) => void,
    onNotificationReceived?: (notification: any) => void,
    onNotificationAction?: (notification: ActionPerformed) => void
  ): void {
    if (!this.isNativePlatform) {
      return;
    }

    // Called when registration is successful
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      if (onRegistration) {
        onRegistration(token);
      }
      // You can send this token to your backend to send push notifications
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ', error);
    });

    // Show us the notification payload when app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push notification received: ', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification);
      if (onNotificationAction) {
        onNotificationAction(notification);
      }
    });
  }

  /**
   * Get list of delivered notifications
   */
  async getDeliveredNotifications() {
    if (!this.isNativePlatform) {
      return [];
    }

    const notificationList = await PushNotifications.getDeliveredNotifications();
    return notificationList.notifications;
  }

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications() {
    if (!this.isNativePlatform) {
      return;
    }

    await PushNotifications.removeAllDeliveredNotifications();
  }

  /**
   * Send a local notification (appears even without internet)
   */
  async sendLocalNotification(title: string, body: string, id?: number) {
    if (!this.isNativePlatform) {
      console.log('Local notifications only work on native platforms');
      return;
    }

    // Note: For local notifications, you'll need @capacitor/local-notifications
    // This is a placeholder showing how it would work
    console.log(`Local notification: ${title} - ${body}`);
  }
}

// Export a singleton instance
export const capacitorNotifications = CapacitorNotificationService.getInstance();
