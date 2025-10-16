import { supabase } from '@/integrations/supabase/client';
import { requestPermissionAndToken, listenToForegroundMessages } from './firebase';
import { toast } from '@/hooks/use-toast';

export async function enablePushForCurrentUser(userId: string) {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const token = await requestPermissionAndToken();
    if (!token) return;

    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token } as any)
      .eq('id', userId);

    if (error) {
      console.error('Failed to store FCM token', error);
    }

    await listenToForegroundMessages((payload) => {
      const title = payload?.notification?.title || 'TaskHive';
      const body = payload?.notification?.body || '';
      const data = payload?.data || {};
      // Use global toast function directly
      toast({ title, description: body });
      // You can also perform client-side routing based on data.url or data.task_id here
    });
  } catch (e) {
    console.error('enablePushForCurrentUser error', e);
  }
}
