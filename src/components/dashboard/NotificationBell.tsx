import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import echo, { initializeEcho } from "@/lib/echo";
import { getApiUrl } from "@/config/api.config";

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
  const { token, user } = useAuth();
  const { toast } = useToast();
  const playedNotificationsRef = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load notification sound (calm bell sound)
  useEffect(() => {
    // Create audio context for bell sound
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not available');
    }
  }, []);

  // Play bell sound once per notification
  const playBellSound = (notificationId: number) => {
    // Check if we already played sound for this notification
    if (playedNotificationsRef.current.has(notificationId)) {
      return;
    }
    
    // Mark as played
    playedNotificationsRef.current.add(notificationId);
    
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Create a bell-like sound with multiple harmonics
    // Bell sound: fundamental + harmonics with decay
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - pleasant bell chord
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, now);
      osc.type = 'sine';
      
      // Bell envelope: quick attack, slow decay
      const delay = index * 0.05; // Slight delay for each harmonic
      const volume = 0.15 / (index + 1); // Lower volume for higher harmonics
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.6);
      
      oscillators.push(osc);
      gainNodes.push(gain);
    });
  };

  // Fetch notifications
  useEffect(() => {
    if (token && user) {
      // Initialize Echo with current token
      const currentEcho = initializeEcho();
      
      // Initial fetch
      fetchNotifications();
      fetchUnreadCount();
      
      // Setup Pusher listener for notifications
      if (currentEcho) {
        try {
          const channel = currentEcho.private(`user.${user.id}`);
          
          channel.listen('.notification.received', (e: any) => {
            console.log('New notification received via Pusher:', e);
            const notification = e.notification || e;
            
            // Add notification to list
            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notification.id);
              if (exists) return prev;
              return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);
            
            // Play bell sound once per notification
            playBellSound(notification.id);
            
            // Show toast
            toast({
              title: notification.title,
              description: notification.message,
            });
            
            // Also fetch to ensure consistency
            fetchNotifications();
          });

          console.log('Pusher notification listener set up');
        } catch (error) {
          console.warn('Pusher notification channel failed, using polling:', error);
        }
      } else {
        console.log('Pusher not available, using polling mode');
      }
      
      // Poll for new notifications every 5 seconds (optimized for performance)
      // This ensures notifications appear even without WebSocket
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 5000);

      return () => {
        clearInterval(interval);
        if (currentEcho && user) {
          try {
            currentEcho.leave(`private-user.${user.id}`);
          } catch (e) {
            // Ignore errors
          }
        }
      };
    }
  }, [token, user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(getApiUrl('/notifications'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const previousNotificationIds = new Set(notifications.map(n => n.id));
        const newNotifications = data.filter((n: Notification) => !previousNotificationIds.has(n.id));
        
        if (newNotifications.length > 0) {
          console.log(`Found ${newNotifications.length} new notifications`);
          
          // Play sound and show toast for each new notification (only once)
          newNotifications.forEach((notification: Notification) => {
            // Play bell sound once per notification
            playBellSound(notification.id);
            
            // Show toast
            toast({
              title: notification.title,
              description: notification.message,
            });
          });
        }
        
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      } else {
        // Log error details for debugging
        const errorText = await response.text();
        console.error(`❌ [Notifications] Failed to fetch: ${response.status} ${response.statusText}`);
        console.error(`❌ [Notifications] Response:`, errorText);
        
        if (response.status === 500) {
          console.error('❌ [Notifications] 500 Error - Check Laravel logs:');
          console.error('   C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log');
        }
      }
    } catch (error) {
      console.error("❌ [Notifications] Fetch error:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(getApiUrl('/notifications/unread-count'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newCount = data.count;
        const previousCount = unreadCount;
        
        if (newCount > previousCount) {
          // New notifications arrived - fetch them immediately
          console.log(`New notifications detected: ${newCount} > ${previousCount}`);
          await fetchNotifications();
        }
        setUnreadCount(newCount);
      } else {
        // Log error details for debugging
        if (response.status === 500) {
          const errorText = await response.text();
          // Only log once to avoid spam
          if (!(window as any).__notificationsUnreadErrorLogged) {
            (window as any).__notificationsUnreadErrorLogged = true;
            console.error(`❌ [Notifications] 500 Error on /api/notifications/unread-count`);
            console.error(`❌ [Notifications] Response:`, errorText.substring(0, 200)); // Limit length
            console.error(`❌ [Notifications] Check Laravel logs: C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log`);
            console.warn('⚠️ [Notifications] Backend endpoint might not exist or has errors');
            console.warn('⚠️ [Notifications] Will calculate unread count from fetched notifications instead');
          }
          // Fallback: calculate unread count from fetched notifications
          // This will be done when fetchNotifications() runs
          // Don't update unreadCount here - let fetchNotifications() handle it
        } else if (response.status !== 500) {
          console.warn(`⚠️ [Notifications] Unread count failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("❌ [Notifications] Unread count network error:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${id}/read`), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(getApiUrl("/notifications/read-all"), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        if (response.status === 404) {
          // Notification already deleted or doesn't exist - remove from UI anyway
          console.warn(`⚠️ [Notifications] Notification ${id} not found (already deleted?)`);
          setNotifications(prev => prev.filter(n => n.id !== id));
        } else {
          console.error(`❌ [Notifications] Failed to delete: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("❌ [Notifications] Delete error:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'task_assigned':
        return '✅';
      case 'message':
        return '💬';
      case 'project_message':
        return '📁';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Map notification links to page IDs
    let pageId: string | null = null;
    
    if (notification.link) {
      // Map backend links to frontend page IDs
      if (notification.link === '/events' || notification.link.startsWith('/events')) {
        pageId = 'events';
      } else if (notification.link === '/general' || notification.link.startsWith('/general')) {
        pageId = 'general';
      } else if (notification.link === '/project' || notification.link.startsWith('/project')) {
        pageId = 'project';
      } else if (notification.link === '/home' || notification.link.startsWith('/home')) {
        pageId = 'home';
      } else if (notification.data?.project_id) {
        // If it's a project message, go to project page
        pageId = 'project';
      } else if (notification.type === 'task_assigned') {
        // Task assignments go to home (task board)
        pageId = 'home';
      } else if (notification.type === 'event') {
        pageId = 'events';
      } else if (notification.type === 'message') {
        pageId = 'general';
      } else if (notification.type === 'project_message') {
        pageId = 'project';
      }
    } else {
      // Fallback based on notification type
      switch (notification.type) {
        case 'event':
          pageId = 'events';
          break;
        case 'task_assigned':
          pageId = 'home';
          break;
        case 'message':
          pageId = 'general';
          break;
        case 'project_message':
          pageId = 'project';
          break;
        default:
          pageId = 'home';
      }
    }
    
    if (pageId && onNavigate) {
      setIsOpen(false);
      onNavigate(pageId);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-primary/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-card border-white/10 z-[99999]" align="end" style={{ zIndex: 99999 }}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-white/5 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium text-sm",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

