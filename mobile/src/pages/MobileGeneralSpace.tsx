import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Loader2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  user: string;
  user_id: number;
  content: string;
  time: string;
  created_at: string;
}

export default function MobileGeneralSpace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { token, user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(getApiUrl('/messages/general'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(getApiUrl('/messages/general'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });

      if (response.ok) {
        fetchMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {messages.map((msg, index) => {
              const isOwn = msg.user_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-2',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.user}`} />
                      <AvatarFallback className="text-[10px]">{getInitials(msg.user)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  {/* Message Bubble */}
                  <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                    {showAvatar && !isOwn && (
                      <span className="text-[10px] text-muted-foreground mb-1 px-1">
                        {msg.user}
                      </span>
                    )}
                    
                    <div className={cn(
                      'message-bubble',
                      isOwn ? 'sent' : 'received'
                    )}>
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>

                    <span className={cn(
                      'text-[10px] text-muted-foreground mt-1 px-1',
                      isOwn ? 'text-right' : 'text-left'
                    )}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border/30 bg-background/80 ios-blur px-4 py-3" style={{ paddingBottom: 'calc(80px + var(--safe-area-bottom))' }}>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-secondary/50">
            <Image className="w-5 h-5 text-muted-foreground" />
          </button>

          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="mobile-input flex-1"
          />

          <button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              newMessage.trim()
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground'
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
