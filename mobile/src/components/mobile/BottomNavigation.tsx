import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  MessageSquare, 
  Folder, 
  Calendar, 
  Users,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface BottomNavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', icon: LayoutGrid, label: 'Home' },
  { id: 'general', icon: MessageSquare, label: 'Chat' },
  { id: 'project', icon: Folder, label: 'Projects' },
  { id: 'notifications', icon: Bell, label: 'Alerts' },
  { id: 'events', icon: Calendar, label: 'Events' },
];

export default function BottomNavigation({ activePage, onNavigate }: BottomNavigationProps) {
  const handlePress = async (id: string) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available in browser
    }
    onNavigate(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 ios-blur border-t border-border/30">
      <div className="flex items-center justify-around h-16 px-2" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handlePress(item.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 relative transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}

              <Icon className={cn(
                'w-6 h-6 transition-transform',
                isActive && 'scale-110'
              )} />
              
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
