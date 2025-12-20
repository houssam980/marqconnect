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
  const [unreadCount, setUnreadCount] = useState(0);
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

  return (
    <>
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center relative active:bg-white/10 transition-colors"
        onClick={() => onNavigate?.('notifications')}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
