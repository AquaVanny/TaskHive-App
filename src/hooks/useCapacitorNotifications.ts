import { useEffect, useState, useCallback } from 'react';
import { capacitorNotifications } from '@/services/capacitorNotificationService';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Storage key for notification permission
const NOTIFICATION_PERMISSION_KEY = 'taskhive_notification_permission';

// Check if we're on Android
const isAndroid = Capacitor.getPlatform() === 'android';

export const useCapacitorNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load and check notification permission status
  useEffect(() => {
    const checkAndSetPermission = async () => {
      try {
        // On Android, we need to check with the actual permission state
        if (isAndroid) {
          const permissionStatus = await PushNotifications.checkPermissions();
          const status = permissionStatus.receive;
          setPermissionStatus(status);
          
          // If already granted, ensure we have the token
          if (status === 'granted') {
            try {
              const token = await PushNotifications.getToken();
              if (token && token.value) {
                setPushToken(token.value);
                await savePushToken(token.value);
              }
            } catch (error) {
              console.error('Error getting push token:', error);
            }
          }
        } else {
          // For web/iOS, use our saved state
          const savedStatus = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
          if (savedStatus) {
            setPermissionStatus(savedStatus);
          } else {
            const status = await capacitorNotifications.checkPermissions();
            setPermissionStatus(status);
          }
        }
      } catch (error) {
        console.error('Error checking notification permission:', error);
        setPermissionStatus('denied');
      }
    };

    checkAndSetPermission();
  }, []);

  // Save push token to Supabase
  const savePushToken = useCallback(async (token: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      
      await supabase
        .from('profiles')
        .update({
          push_token: token,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, []);

  // Save permission status to storage
  const savePermissionStatus = useCallback(async (status: string) => {
    try {
      if (!isAndroid) {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, status);
      }
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error saving notification permission:', error);
    }
  }, [isAndroid]);

  // Initialize notifications
  useEffect(() => {
    if (isInitialized) return;

    const initialize = async () => {
      try {
        // Set up listeners first
        capacitorNotifications.setupListeners(
          // On registration success
          async (token: Token) => {
            console.log('📱 Push token received:', token.value);
            setPushToken(token.value);
            
            // Send the push token to the profiles table
            try {
              const user = (await supabase.auth.getUser()).data.user;
              if (!user) return;
              
              const { error } = await supabase
                .from('profiles')
                .update({
                  push_token: token.value,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
                
              if (error) throw error;
              console.log('Push token saved to user profile');
            } catch (error) {
              console.error('Error saving push token:', error);
            }
          },
          // On notification received while app is open
          (notification: any) => {
            toast.info(notification.title, {
              description: notification.body,
            });
          },
          // On notification clicked
          (notification: any) => {
            console.log('Notification clicked:', notification);
            // Handle navigation based on notification data
          }
        );

        // Initialize notifications if permission is granted
        if (permissionStatus === 'granted') {
          await capacitorNotifications.initialize();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initialize();
  }, [permissionStatus, isInitialized]);

  const requestPermission = useCallback(async (): Promise<string> => {
    try {
      // If already granted, return early
      if (permissionStatus === 'granted') {
        return 'granted';
      }

      let result = 'denied';
      
      if (isAndroid) {
        // On Android, we need to handle the permission flow differently
        const permission = await PushNotifications.requestPermissions();
        result = permission.receive;
        
        if (result === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
          
          // Get the token and save it
          try {
            const token = await PushNotifications.getToken();
            if (token && token.value) {
              setPushToken(token.value);
              await savePushToken(token.value);
            }
          } catch (error) {
            console.error('Error getting push token:', error);
          }
          
          toast.success('Push notifications enabled! 🔔');
        } else {
          toast.error('Push notifications denied. You can enable them in settings.');
        }
      } else {
        // For web/iOS, use our existing flow
        result = await capacitorNotifications.initialize();
        
        if (result === 'granted') {
          toast.success('Push notifications enabled! 🔔');
        } else {
          toast.error('Push notifications denied. You can enable them in settings.');
        }
      }
      
      // Update our state
      await savePermissionStatus(result);
      return result;
      
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      await savePermissionStatus('denied');
      return 'denied';
    }
  }, [permissionStatus, savePermissionStatus, isAndroid, savePushToken]);

  // Only expose the necessary values
  return {
    permissionStatus,
    pushToken,
    requestPermission,
    isInitialized
  };
};
