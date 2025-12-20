import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/config/api.config';
import { initializeEcho } from '@/lib/echo';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  data: any;
  read: boolean;
  created_at: string;
}

interface MobileNotificationsProps {
  onNavigate?: (page: string) => void;
}

export default function MobileNotifications({ onNavigate }: MobileNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();
  const { toast } = useToast();
  const playedNotificationsRef = useRef<Set<number>>(new Set());
  const fetchingRef = useRef(false);

  const notifyUser = (notificationId: number) => {
    if (playedNotificationsRef.current.has(notificationId)) return;
    playedNotificationsRef.current.add(notificationId);
    if ('vibrate' in navigator) navigator.vibrate(200);
  };

  useEffect(() => {
    if (!token || !user) return;

    fetchNotifications();

    const currentEcho = initializeEcho();
    if (currentEcho) {
      try {
        const channel = currentEcho.private(`user.${user.id}`);
        channel.listen('.notification.received', (e: any) => {
          const notification = e.notification || e;
          notifyUser(notification.id);
          toast({ title: notification.title, description: notification.message });
          fetchNotifications();
        });
      } catch (error) {
        console.warn('Pusher failed, using polling only');
      }
    }

    const interval = setInterval(() => {
      if (!fetchingRef.current) fetchNotifications();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (currentEcho && user) {
        try {
          currentEcho.leave(`private-user.${user.id}`);
        } catch (e) {}
      }
    };
  }, [token, user]);

  const fetchNotifications = async () => {
    if (fetchingRef.current || !token) return;

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/notifications'), {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${id}/read`), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(getApiUrl("/notifications/read-all"), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({ title: "All notifications marked as read" });
      }
    } catch (error) {}
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${id}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok || response.status === 404) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast({ title: "Notification deleted" });
      }
    } catch (error) {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event': return '📅';
      case 'task_assigned': return '✅';
      case 'message': return '💬';
      case 'project_message': return '📁';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);

    let pageId: string | null = null;

    if (notification.link) {
      if (notification.link.includes('/events')) pageId = 'events';
      else if (notification.link.includes('/general')) pageId = 'general';
      else if (notification.link.includes('/project')) pageId = 'project';
      else if (notification.link.includes('/home')) pageId = 'home';
    }

    if (!pageId) {
      switch (notification.type) {
        case 'event': pageId = 'events'; break;
        case 'task_assigned': pageId = 'home'; break;
        case 'message': pageId = 'general'; break;
        case 'project_message': pageId = 'project'; break;
        default: pageId = 'home';
      }
    }

    if (pageId && onNavigate) {
      onNavigate(pageId);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead} 
            className="text-xs h-8 px-3 rounded-lg bg-primary/10 text-primary active:bg-primary/20 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 active:bg-accent/50 transition-colors",
                  !notification.read && "bg-primary/5 border-l-4 border-l-primary"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!notification.read && (
                          <button
                            className="p-1.5 rounded-full hover:bg-accent active:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-full hover:bg-accent active:bg-accent text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
