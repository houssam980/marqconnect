import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { initializeEcho } from "@/lib/echo";
import { getApiUrl } from "@/config/api.config";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBellProps {
  onNavigate?: (page: string) => void;
}

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

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    fetchUnreadCount();
    
    const interval = setInterval(() => {
      if (!fetchingRef.current) fetchUnreadCount();
    }, 10000);

    const currentEcho = initializeEcho();
    if (currentEcho) {
      try {
        const channel = currentEcho.private(`user.${user.id}`);
        channel.listen('.notification.received', (e: any) => {
          const notification = e.notification || e;
          setUnreadCount(prev => prev + 1);
          notifyUser(notification.id);
          toast({ title: notification.title, description: notification.message });
        });
      } catch (error) {
        console.warn('Pusher failed, using polling only');
      }
    }

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
        setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchUnreadCount = async () => {
    if (fetchingRef.current || !token) return;
    
    try {
      const response = await fetch(getApiUrl('/notifications/unread-count'), {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {}
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${id}/read`), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        setUnreadCount(0);
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
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
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
      setIsOpen(false);
      onNavigate(pageId);
    }
  };

  return (
    <>
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center relative active:bg-white/10 transition-colors"
        onClick={() => {
          setIsOpen(true);
          if (notifications.length === 0) fetchNotifications();
        }}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
              style={{ zIndex: 99999 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-[#1a1a1a] rounded-2xl flex flex-col shadow-2xl border border-white/10"
              style={{ zIndex: 100000, maxHeight: '80vh' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center gap-1">
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark all</span>
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn("p-4 active:bg-white/10 transition-colors", !notification.read && "bg-primary/10")}
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
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {!notification.read && (
                                  <button
                                    className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20"
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 text-red-400"
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
