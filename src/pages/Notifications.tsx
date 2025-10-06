import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Trash2, Calendar, Users, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'task' | 'habit' | 'team';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task',
    title: 'Task Due Soon',
    message: 'Complete project proposal is due in 2 hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: '2',
    type: 'habit',
    title: 'Habit Reminder',
    message: "Don't forget your daily reading habit",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: false,
  },
  {
    id: '3',
    type: 'team',
    title: 'New Task Assignment',
    message: 'You were assigned to "Update documentation"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'task' | 'habit' | 'team'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Calendar className="h-5 w-5" />;
      case 'habit':
        return <Target className="h-5 w-5" />;
      case 'team':
        return <Users className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTimestamp = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear all
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="habit">Habits</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
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
                    className={`cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-full h-fit ${
                          notification.type === 'task' ? 'bg-blue-500/10 text-blue-500' :
                          notification.type === 'habit' ? 'bg-green-500/10 text-green-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {getTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
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
