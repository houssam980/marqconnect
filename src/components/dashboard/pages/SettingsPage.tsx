import React, { useState, useEffect, useRef } from "react";
import { DashboardCard } from "../DashboardCard";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/config/api.config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Save, Shield, Bell, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";

export function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Profile form state
  const [username, setUsername] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Notification preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setUsername(user.name || "");
      // Load notification preferences from localStorage
      const savedPrefs = localStorage.getItem(`notifications_enabled_${user.id}`);
      setNotificationsEnabled(savedPrefs !== 'false');
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if token exists
    if (!token) {
      toast({
        title: "Error",
        description: "You are not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProfileMessage(null);
    
    try {
      console.log('🔄 [Settings] Updating profile...', { username, tokenExists: !!token });
      
      const response = await fetch(getApiUrl('/user/update-profile'), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: username,
        }),
      });

      const data = await response.json();
      console.log('📥 [Settings] Profile update response:', { status: response.status, data });

      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        setProfileMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      if (response.ok) {
        console.log('✅ Profile updated successfully');
        
        // First clear loading state
        setIsLoading(false);
        
        // Then refresh user context
        await refreshUser();
        
        // Show success message
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Auto-hide after 3 seconds
        setTimeout(() => setProfileMessage(null), 3000);
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("❌ [Settings] Profile update error:", error);
      setIsLoading(false);
      setProfileMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);
    setPasswordMessage(null);
    
    try {
      console.log('🔄 [Settings] Changing password...');
      
      const response = await fetch(getApiUrl('/user/change-password'), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();
      console.log('📥 [Settings] Password change response:', { status: response.status, data });

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Auto-hide after 3 seconds
        setTimeout(() => setPasswordMessage(null), 3000);
      } else {
        throw new Error(data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("❌ [Settings] Password change error:", error);
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password. Check your current password.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    // Save to localStorage for persistence
    if (user) {
      localStorage.setItem(`notifications_enabled_${user.id}`, enabled.toString());
    }

    try {
      console.log('🔄 [Settings] Updating notification preferences...', { enabled });
      
      const response = await fetch(getApiUrl('/user/notification-preferences'), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          notifications_enabled: enabled,
        }),
      });

      const data = await response.json();
      console.log('📥 [Settings] Notification preferences response:', { status: response.status, data });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        // If backend fails, still keep localStorage setting
        console.warn('⚠️ [Settings] Backend update failed, using localStorage only');
      }
    } catch (error: any) {
      console.error("❌ [Settings] Notification preferences error:", error);
      // Don't show error toast - localStorage setting is enough
    }
  };

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="shrink-0">
        <h2 className="text-2xl font-display font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-y-auto pb-4">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard title="Profile Information" className="overflow-visible">
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-primary/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-lg">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{displayEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role: <span className="font-medium capitalize">{user?.role || 'User'}</span>
                  </p>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9 bg-secondary/30 border-white/5 focus-visible:ring-primary" 
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">This name will be displayed to other users</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input 
                      id="email" 
                      type="email" 
                      value={displayEmail} 
                      className="bg-secondary/50 border-white/5 text-muted-foreground cursor-not-allowed" 
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              {profileMessage && (
                <div className={`p-3 rounded-lg border ${profileMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {profileMessage.type === 'success' ? ' ' : ' '}{profileMessage.text}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" /> 
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DashboardCard>

          <DashboardCard title="Security">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="current-password" 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-9 pr-9 bg-secondary/30 border-white/5 focus-visible:ring-primary" 
                      placeholder="Enter current password"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="new-password" 
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 pr-9 bg-secondary/30 border-white/5 focus-visible:ring-primary" 
                      placeholder="Enter new password (min 8 characters)"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="confirm-password" 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 bg-secondary/30 border-white/5 focus-visible:ring-primary" 
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg border ${passwordMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMessage.type === 'success' ? '' : ' '}{passwordMessage.text}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isPasswordLoading}
                  variant="outline" 
                  className="border-white/10 hover:bg-primary hover:text-primary-foreground"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isPasswordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </DashboardCard>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <DashboardCard title="Preferences">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications for events and messages</p>
                </div>
                <Switch 
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <Separator className="bg-white/5" />
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  {notificationsEnabled 
                    ? " You will receive notifications for new messages, tasks, and events"
                    : " Notifications are disabled. You won't receive any alerts"}
                </p>
              </div>
            </div>
          </DashboardCard>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Shield className="w-5 h-5" />
              <h3 className="font-medium">Danger Zone</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all of your content.
            </p>
            <Button variant="destructive" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
