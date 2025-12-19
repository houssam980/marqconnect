import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  User,
  Search,
  MoreVertical,
  Trash2,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  is_online?: boolean;
  last_seen_at?: string;
  last_seen_text?: string;
  created_at: string;
}

export default function MobileEquipe() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [isCreating, setIsCreating] = useState(false);
  
  const { token, user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(getApiUrl('/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(getApiUrl(`/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await fetch(getApiUrl('/users'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (response.ok) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('user');
        setShowAddSheet(false);
        fetchUsers();
        toast({ title: 'User created successfully' });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({ title: 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsCreating(false);
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = users.filter(u => u.is_online).length;

  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Team</h2>
            <p className="text-sm text-muted-foreground">
              {users.length} members · {onlineCount} online
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="mobile-input pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredUsers.map((userData, index) => (
              <motion.div
                key={userData.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="mobile-card p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar with status */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`} />
                      <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
                      userData.is_online ? 'bg-green-500' : 'bg-muted-foreground'
                    )} />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{userData.name}</h3>
                      {userData.role === 'admin' && (
                        <Badge className="bg-primary/20 text-primary text-[10px] px-1.5">
                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {userData.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {userData.is_online ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Online now
                        </span>
                      ) : userData.last_seen_text ? (
                        <span className="text-muted-foreground">
                          Last seen {userData.last_seen_text}
                        </span>
                      ) : (
                        `Joined ${new Date(userData.created_at).toLocaleDateString()}`
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  {user?.id !== userData.id && (
                    <button 
                      onClick={() => handleDeleteUser(userData.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center active:bg-destructive/20"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAddSheet(true)}>
        <Plus className="w-6 h-6" />
      </button>

      {/* Add User Sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowAddSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-3xl z-50"
              style={{ bottom: '80px', maxHeight: '60vh' }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Add Team Member</h2>
                <button
                  onClick={() => setShowAddSheet(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="px-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 180px)' }}>
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Full Name</label>
                  <Input
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter name..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Enter email..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Password</label>
                  <Input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Role</label>
                  <div className="flex gap-2">
                    {(['user', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setNewUserRole(r)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm capitalize transition-colors flex-1',
                          newUserRole === r
                            ? 'bg-primary/20 text-primary border border-primary/50'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        )}
                      >
                        {r === 'admin' && <Shield className="w-4 h-4 inline mr-1" />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Button at Bottom */}
              <div className="p-4 mt-2">
                <button
                  onClick={handleAddUser}
                  disabled={!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || isCreating}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isCreating ? 'Creating...' : 'Add Member'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
