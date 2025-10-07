import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Trash2, Calendar, Users, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationsStore } from '@/store/notificationsStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const [filter, setFilter] = useState<'all' | 'task_created' | 'task_assigned' | 'task_completed' | 'member_added'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id);
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (user?.id) {
        await fetchNotifications(user.id);
      }
      
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        await fetchNotifications(user.id);
        
        toast({
          title: 'Success',
          description: 'All notifications cleared',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear notifications',
          variant: 'destructive',
        });
      }
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.task_id) {
      navigate('/tasks');
    } else if (notification.organization_id) {
      navigate(`/organizations/${notification.organization_id}`);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('task')) return <Calendar className="h-5 w-5" />;
    if (type.includes('habit')) return <Target className="h-5 w-5" />;
    if (type.includes('member')) return <Users className="h-5 w-5" />;
    return <Bell className="h-5 w-5" />;
  };

  const getIconColor = (type: string) => {
    if (type.includes('task')) return 'bg-blue-500/10 text-blue-500';
    if (type.includes('habit')) return 'bg-green-500/10 text-green-500';
    if (type.includes('member')) return 'bg-purple-500/10 text-purple-500';
    return 'bg-gray-500/10 text-gray-500';
  };

  const filteredNotifications = notifications.filter(
    n => filter === 'all' || n.type === filter
  );

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your activity</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear all
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="task_created">Tasks</TabsTrigger>
          <TabsTrigger value="member_added">Team</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/5 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-full h-fit ${getIconColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
