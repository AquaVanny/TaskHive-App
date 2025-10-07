import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationsStore } from '@/store/notificationsStore';
import { useAuthStore } from '@/store/authStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, subscribeToNotifications } = useNotificationsStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Initial fetch
      fetchNotifications(user.id);
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToNotifications(user.id);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user?.id]);

  const handleNotificationClick = async (notificationId: string, taskId?: string, organizationId?: string) => {
    await markAsRead(notificationId);
    setIsOpen(false);
    
    if (taskId) {
      navigate('/tasks');
    } else if (organizationId) {
      navigate(`/organizations/${organizationId}`);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsOpen(false);
              navigate('/notifications');
            }}
          >
            View All
          </Button>
        </div>
        <ScrollArea className="h-[300px]">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(
                    notification.id,
                    notification.task_id || undefined,
                    notification.organization_id || undefined
                  )}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    !notification.read ? 'bg-accent/50' : ''
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
