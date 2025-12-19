import React from 'react';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

interface MobileHeaderProps {
  onNavigate?: (page: string) => void;
  activePage?: string;
}

export default function MobileHeader({ onNavigate, activePage }: MobileHeaderProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user?.name || 'User';

  const getPageTitle = () => {
    switch (activePage) {
      case 'home': return 'Dashboard';
      case 'general': return 'General Chat';
      case 'project': return 'Projects';
      case 'events': return 'Events';
      case 'equipe': return 'Team';
      case 'settings': return 'Settings';
      default: return 'MarqenConnect';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 ios-blur border-b border-border/30 pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">
            <img 
              src="https://i.postimg.cc/cJxqztmS/logo-png-01.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationBell onNavigate={onNavigate} />

          {/* Settings */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-secondary/50 transition-colors"
            onClick={() => onNavigate?.('settings')}
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Avatar */}
          <Avatar className="w-9 h-9 border-2 border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
