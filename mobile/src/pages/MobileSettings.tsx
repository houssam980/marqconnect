import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Palette, 
  LogOut,
  ChevronRight,
  Loader2,
  Check
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

export default function MobileSettings() {
  const { user, token, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'notifications'>('main');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/user/update-profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      if (response.ok) {
        await refreshUser(); // Refresh user data to update UI
        toast({ title: 'Success', description: 'Profile updated' });
        setActiveSection('main');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Profile Section

  // Sub-sections
  if (activeSection === 'profile') {
    return (
      <div className="flex flex-col h-full pb-safe">
        <div className="px-4 pt-4">
          <button 
            onClick={() => setActiveSection('main')}
            className="text-primary text-sm font-medium"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold mt-2">Edit Profile</h2>
        </div>

        <div className="flex-1 px-4 pt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mobile-input"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <Input
              type="email"
              value={email}
              disabled
              className="mobile-input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          {/* Password change message */}
          <div className="mobile-card p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">Change Password</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  To update your password, please use the desktop version of MarqenConnect.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={isLoading}
            className="mobile-btn w-full bg-primary text-primary-foreground mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  }

  if (activeSection === 'notifications') {
    return (
      <div className="flex flex-col h-full pb-safe">
        <div className="px-4 pt-4">
          <button 
            onClick={() => setActiveSection('main')}
            className="text-primary text-sm font-medium"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold mt-2">Notifications</h2>
        </div>

        <div className="flex-1 px-4 pt-6 space-y-4">
          <div className="mobile-card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Push Notifications</h3>
              <p className="text-xs text-muted-foreground">Get notified on your device</p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>

          <div className="mobile-card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Email Notifications</h3>
              <p className="text-xs text-muted-foreground">Receive email updates</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
        </div>
      </div>
    );
  }

  // Main Settings View
  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Profile Card */}
      <div className="px-4 pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-card p-5"
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} />
              <AvatarFallback className="text-lg">{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-primary mt-1 capitalize">{user?.role}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Settings Menu */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 hide-scrollbar">
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-3">Account</h3>
          
          <button 
            onClick={() => setActiveSection('profile')}
            className="w-full mobile-card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-sm">Edit Profile</h3>
              <p className="text-xs text-muted-foreground">Update your information</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button 
            onClick={() => setActiveSection('notifications')}
            className="w-full mobile-card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-sm">Notifications</h3>
              <p className="text-xs text-muted-foreground">Manage notifications</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Logout */}
        <div className="mt-8 pb-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full mobile-btn border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            MarqenConnect Mobile v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
