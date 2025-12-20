import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Users, 
  ChevronRight,
  ArrowLeft,
  Send,
  Loader2,
  MoreVertical,
  X,
  Edit2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

interface Project {
  id: number;
  name: string;
  description?: string;
  members_count?: number;
  members?: Array<{ id: number; name: string; email: string }>;
  created_at: string;
}

interface Message {
  id: number;
  user: string;
  user_id: number;
  content: string;
  created_at: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

export default function MobileProjectSpace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  
  // Project management states
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Members states
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  
  const { token, user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(getApiUrl('/projects'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    if (!token || !selectedProject) return;
    
    try {
      const response = await fetch(getApiUrl(`/messages/project-${selectedProject.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedMessages = Array.isArray(data) 
          ? [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          : [];
        setMessages(sortedMessages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [token, selectedProject]);

  const fetchAllUsers = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    
    try {
      const response = await fetch(getApiUrl('/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [token, user]);

  useEffect(() => {
    fetchProjects();
    fetchAllUsers();
  }, [fetchProjects, fetchAllUsers]);

  useEffect(() => {
    if (selectedProject) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedProject, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !selectedProject) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(getApiUrl(`/messages/project-${selectedProject.id}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await fetch(getApiUrl('/projects'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setNewProjectDescription('');
        setShowAddSheet(false);
        fetchProjects();
        toast({ title: 'Project created successfully' });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({ title: 'Failed to create project', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditProject = async () => {
    if (!editProjectName.trim() || isUpdating || !selectedProject) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: editProjectName,
          description: editProjectDescription,
        }),
      });

      if (response.ok) {
        setShowEditSheet(false);
        fetchProjects();
        toast({ title: 'Project updated successfully' });
        setSelectedProject(prev => prev ? { ...prev, name: editProjectName, description: editProjectDescription } : null);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast({ title: 'Failed to update project', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/projects/${projectToDelete.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setProjectToDelete(null);
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(null);
        }
        fetchProjects();
        toast({ title: 'Project deleted successfully' });
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({ title: 'Failed to delete project', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInviteMembers = async () => {
    if (selectedMembers.length === 0 || isInviting || !selectedProject) return;
    
    setIsInviting(true);
    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}/invite`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ user_ids: selectedMembers }),
      });

      if (response.ok) {
        setSelectedMembers([]);
        setShowInviteSheet(false);
        toast({ title: 'Members invited successfully' });
        // Refetch project to update members list
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to invite members:', error);
      toast({ title: 'Failed to invite members', variant: 'destructive' });
    } finally {
      setIsInviting(false);
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

  // Project List View
  if (!selectedProject) {
    return (
      <div className="flex flex-col h-full pb-safe">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Select a project to view</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedProject(project)}
                  className="w-full mobile-card p-4 text-left active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 rounded-full hover:bg-destructive/10 shrink-0"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {user?.role === 'admin' && (
          <button className="fab" onClick={() => setShowAddSheet(true)}>
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Add Project Sheet */}
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
                className="fixed left-0 right-0 bg-[#1a1a1a] rounded-t-3xl z-50"
                style={{ bottom: '80px', maxHeight: '55vh' }}
              >
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                <div className="px-4 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Create Project</h2>
                  <button
                    onClick={() => setShowAddSheet(false)}
                    className="p-2 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-4 space-y-3">
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Project Name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Description</label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Enter description..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 min-h-[60px] resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 mt-2">
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || isCreating}
                    className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteDialog && projectToDelete && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50"
                onClick={() => setShowDeleteDialog(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Project</h3>
                  <p className="text-white/70 text-sm mb-6">
                    Are you sure you want to delete "{projectToDelete.name}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 py-2.5 bg-white/10 text-white rounded-xl font-medium active:scale-95 transition-transform"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Project Detail View
  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="bg-background/80 ios-blur border-b border-border/30 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedProject(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-secondary/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{selectedProject.name}</h2>
            {selectedProject.description && (
              <p className="text-xs text-muted-foreground truncate">{selectedProject.description}</p>
            )}
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setEditProjectName(selectedProject.name);
                setEditProjectDescription(selectedProject.description || '');
                setShowEditSheet(true);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-secondary/50"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto hide-scrollbar">
          {(['chat', 'members'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'chat' && <MessageSquare className="w-4 h-4 inline mr-1" />}
              {tab === 'members' && <Users className="w-4 h-4 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%]', isOwn ? 'items-end' : 'items-start')}>
                          {!isOwn && (
                            <div className="text-xs text-muted-foreground mb-1">{msg.user}</div>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2.5',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-secondary text-foreground rounded-bl-md'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
              {selectedProject.members && selectedProject.members.length > 0 ? (
                <div className="space-y-2">
                  {selectedProject.members.map((member) => (
                    <div key={member.id} className="mobile-card p-3 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Users className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No members yet</p>
                </div>
              )}
            </div>

            {user?.role === 'admin' && (
              <div className="px-4 py-3 border-t border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
                <button
                  onClick={() => setShowInviteSheet(true)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium active:scale-95 transition-transform"
                >
                  <UserPlus className="w-5 h-5 inline mr-2" />
                  Invite Members
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowEditSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 right-0 bg-[#1a1a1a] rounded-t-3xl z-50"
              style={{ bottom: '80px', maxHeight: '55vh' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="px-4 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Edit Project</h2>
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 space-y-3">
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Project Name</label>
                  <Input
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Description</label>
                  <textarea
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <div className="p-4 mt-2">
                <button
                  onClick={handleEditProject}
                  disabled={!editProjectName.trim() || isUpdating}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isUpdating ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite Members Sheet */}
      <AnimatePresence>
        {showInviteSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowInviteSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 right-0 bg-[#1a1a1a] rounded-t-3xl z-50"
              style={{ bottom: '80px', maxHeight: '60vh' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="px-4 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Invite Members</h2>
                <button
                  onClick={() => setShowInviteSheet(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 150px)' }}>
                <div className="space-y-2">
                  {allUsers.filter(u => u.id !== user?.id).map((u) => {
                    const isSelected = selectedMembers.includes(u.id);
                    const isMember = selectedProject.members?.some(m => m.id === u.id);
                    
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (isMember) return;
                          setSelectedMembers(prev =>
                            isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        disabled={isMember}
                        className={cn(
                          'w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors',
                          isMember
                            ? 'bg-white/5 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary/20 border border-primary/50'
                            : 'bg-white/5 hover:bg-white/10'
                        )}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{u.name}</p>
                          <p className="text-xs text-white/60 truncate">{u.email}</p>
                        </div>
                        {isMember && (
                          <span className="text-xs text-white/60">Already member</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 mt-2">
                <button
                  onClick={handleInviteMembers}
                  disabled={selectedMembers.length === 0 || isInviting}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isInviting ? 'Inviting...' : `Invite ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
