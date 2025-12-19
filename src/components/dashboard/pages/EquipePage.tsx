import React, { useState, useEffect } from "react";
import { DashboardCard } from "../DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  User, 
  Trash2, 
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from "@/config/api.config";
import { cn } from "@/lib/utils";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  is_online?: boolean;
  last_login?: string;
  current_session_start?: string;
  current_session_end?: string;
}

export function EquipePage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  
  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (token && isAdmin) {
      fetchUsers();
    }
  }, [token, isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('/users'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch users:", errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewUserPassword(password);
    setShowPassword(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter or generate a password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl("/users"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => [data.user, ...prev]);
        
        // Show the password that was used
        setGeneratedPassword(newUserPassword);
        
        // Clear form
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setShowPassword(false);
        setNewUserRole("user");
        
        toast({
          title: "Success",
          description: `User ${data.user.name} created successfully!`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(getApiUrl(`/users/${userId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setGeneratedPassword(null);
    setCopiedPassword(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setShowPassword(false);
    setNewUserRole("user");
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 z-10" style={{ zIndex: 10 }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-2 border-white/30 shadow-2xl z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
            <DialogHeader className="text-foreground">
              <DialogTitle className="text-2xl font-bold text-foreground">Add New User</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new user account. Enter a password or generate one automatically.
              </DialogDescription>
            </DialogHeader>

            {generatedPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-500 mb-2">User created successfully!</p>
                  <div className="flex items-center justify-between gap-2 p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm font-mono">{generatedPassword}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyPassword}
                      className="shrink-0"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Save this password! It won't be shown again.
                  </p>
                </div>
                <Button onClick={closeDialog} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10 bg-secondary/30 border-white/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="pl-10 bg-secondary/30 border-white/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pl-10 pr-10 bg-secondary/30 border-white/10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateStrongPassword}
                      className="shrink-0 bg-secondary/30 border-white/10 hover:bg-primary/20"
                      title="Generate strong password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters. Click 🔄 to generate a strong password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as "admin" | "user")}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-secondary/30 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <DashboardCard className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p>No users yet</p>
            <p className="text-sm mt-1">Click "Add User" to create one</p>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id} className="border-white/5">
                    <TableCell className="font-medium">{userData.name}</TableCell>
                    <TableCell className="text-muted-foreground">{userData.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          userData.role === "admin"
                            ? "text-primary bg-primary/10 border-primary/20"
                            : "text-blue-400 bg-blue-400/10 border-blue-400/20"
                        )}
                      >
                        {userData.role === "admin" ? (
                          <Shield className="w-3 h-3 mr-1" />
                        ) : (
                          <User className="w-3 h-3 mr-1" />
                        )}
                        {userData.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          userData.is_online ? "bg-green-500 animate-pulse" : "bg-gray-500"
                        )} />
                        <span className={cn(
                          "text-xs",
                          userData.is_online ? "text-green-400" : "text-muted-foreground"
                        )}>
                          {userData.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                      {userData.is_online && userData.current_session_start && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Since {new Date(userData.current_session_start).toLocaleTimeString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {userData.last_login ? (
                        <div>
                          <p>{new Date(userData.last_login).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(userData.last_login).toLocaleTimeString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(userData.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(userData.id)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={userData.id === user?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

