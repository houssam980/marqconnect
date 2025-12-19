import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus,
  Filter,
  ChevronRight,
  RefreshCw,
  X,
  Trash2,
  UserPlus,
  Users as UsersIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

interface Task {
  id: number;
  title: string;
  tag?: string;
  status: string;
  priority?: string;
  date?: string;
  assigned_users?: Array<{ id: number; name: string; email: string }>;
  created_by?: { id: number; name: string };
}

interface User {
  id: number;
  name: string;
  email: string;
}

const priorityConfig = {
  low: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Low' },
  medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Medium' },
  high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'High' },
  urgent: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Urgent' },
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

export default function MobileTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'To Do' | 'In Progress' | 'Done'>('all');
  
  // Add task sheet
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Task detail sheet
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // Assign users sheet
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
  const [tempAssignees, setTempAssignees] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { token, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(getApiUrl('/tasks'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    
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
  }, [token, isAdmin]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl('/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          status: 'To Do',
          tag: 'General',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          assignees: selectedAssignees,
        }),
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setSelectedAssignees([]);
        setShowAddSheet(false);
        fetchTasks();
        toast({ title: 'Task created successfully' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create task:', errorData);
        toast({ title: 'Failed to create task', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch(getApiUrl(`/tasks/${taskId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state immediately
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
        }
        fetchTasks();
        toast({ title: 'Status updated successfully' });
      } else {
        toast({ title: 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Alias for task detail sheet
  const handleStatusChange = handleUpdateStatus;

  const handleAssignUsers = async () => {
    if (!taskToAssign || isAssigning) return;
    
    setIsAssigning(true);
    try {
      const response = await fetch(getApiUrl(`/tasks/${taskToAssign.id}/assign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_ids: tempAssignees }),
      });

      if (response.ok) {
        setShowAssignSheet(false);
        setTaskToAssign(null);
        setTempAssignees([]);
        fetchTasks();
        toast({ title: 'Users assigned successfully' });
      } else {
        toast({ title: 'Failed to assign users', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to assign users:', error);
      toast({ title: 'Failed to assign users', variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/tasks/${taskToDelete.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setTaskToDelete(null);
        if (selectedTask?.id === taskToDelete.id) {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }
        fetchTasks();
        toast({ title: 'Task deleted successfully' });
      } else {
        toast({ title: 'Failed to delete task', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
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

  const filteredTasks = tasks.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

  const taskCounts = {
    todo: tasks.filter(t => t.status === 'To Do').length,
    in_progress: tasks.filter(t => t.status === 'In Progress').length,
    done: tasks.filter(t => t.status === 'Done').length,
  };

  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Stats Cards */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mobile-card p-4"
          >
            <div className="flex items-center justify-between">
              <Circle className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{taskCounts.todo}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">To Do</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mobile-card p-4"
          >
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{taskCounts.in_progress}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">In Progress</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mobile-card p-4"
          >
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-foreground">{taskCounts.done}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Done</p>
          </motion.div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Tasks</h2>
          <button 
            onClick={handleRefresh}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-secondary/50"
          >
            <RefreshCw className={cn('w-5 h-5 text-muted-foreground', isRefreshing && 'animate-spin')} />
          </button>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {['all', 'todo', 'in_progress', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground'
              )}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredTasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Circle;
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskDetail(true);
                  }}
                  className="mobile-card p-4 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'font-semibold text-sm mb-1',
                        task.status === 'Done' && 'line-through text-muted-foreground'
                      )}>
                        {task.title}
                      </h3>

                      {task.tag && (
                        <p className="text-xs text-muted-foreground mb-2">{task.tag}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[10px] px-2 py-0.5',
                            task.status === 'Done' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            task.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          )}
                        >
                          {task.status}
                        </Badge>

                        {task.date && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.date}
                          </span>
                        )}

                        {task.assigned_users && task.assigned_users.length > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <UsersIcon className="w-3 h-3" />
                            {task.assigned_users.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {user?.role === 'admin' && (
        <button className="fab" onClick={() => setShowAddSheet(true)}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Task Sheet */}
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
              style={{ bottom: '80px', maxHeight: '60vh' }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Add New Task</h2>
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
                  <label className="text-sm text-white/70 mb-1 block">Title</label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 min-h-[60px] resize-none"
                  />
                </div>

                {allUsers.length > 0 && (
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Assign To</label>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedAssignees(prev =>
                              prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className={cn(
                            'w-full p-2 rounded-lg text-left flex items-center gap-2 transition-colors',
                            selectedAssignees.includes(u.id)
                              ? 'bg-primary/20 border border-primary/50'
                              : 'bg-white/5 hover:bg-white/10'
                          )}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-white">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 mt-2">
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || isSubmitting}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Detail Sheet */}
      <AnimatePresence>
        {showTaskDetail && selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => {
                setShowTaskDetail(false);
                setSelectedTask(null);
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 right-0 bg-[#1a1a1a] rounded-t-3xl z-50"
              style={{ bottom: '80px', maxHeight: '70vh' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="px-4 pb-3 flex items-center justify-between border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Task Details</h2>
                <div className="flex gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setTaskToAssign(selectedTask);
                          setTempAssignees(selectedTask.assigned_users?.map(u => u.id) || []);
                          setShowAssignSheet(true);
                        }}
                        className="p-2 rounded-full hover:bg-white/10"
                      >
                        <UserPlus className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => {
                          setTaskToDelete(selectedTask);
                          setShowDeleteDialog(true);
                        }}
                        className="p-2 rounded-full hover:bg-white/10"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowTaskDetail(false);
                      setSelectedTask(null);
                    }}
                    className="p-2 rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 200px)' }}>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedTask.title}</h3>
                  {selectedTask.tag && (
                    <p className="text-sm text-white/70">{selectedTask.tag}</p>
                  )}
                </div>

                {selectedTask.date && (
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Due Date</label>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <Clock className="w-4 h-4" />
                      {selectedTask.date}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-white/50 block mb-2">Status</label>
                  <div className="flex gap-2">
                    {['To Do', 'In Progress', 'Done'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedTask.id, status)}
                        className={cn(
                          'flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all',
                          selectedTask.status === status
                            ? status === 'Done' ? 'bg-green-500/30 text-green-400 border border-green-500/50' :
                              status === 'In Progress' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' :
                              'bg-gray-500/30 text-gray-400 border border-gray-500/50'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-2">Assigned To</label>
                  {selectedTask.assigned_users && selectedTask.assigned_users.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTask.assigned_users.map((u) => (
                        <div key={u.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{u.name}</p>
                            <p className="text-xs text-white/50">{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/50">No one assigned</p>
                  )}
                </div>

                {selectedTask.created_by && (
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Created By</label>
                    <p className="text-sm text-white/90">{selectedTask.created_by.name}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Users Sheet */}
      <AnimatePresence>
        {showAssignSheet && taskToAssign && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => {
                setShowAssignSheet(false);
                setTaskToAssign(null);
              }}
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
                <h2 className="text-lg font-semibold text-white">Assign Users</h2>
                <button
                  onClick={() => {
                    setShowAssignSheet(false);
                    setTaskToAssign(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 140px)' }}>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setTempAssignees(prev =>
                        prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                      );
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg text-left flex items-center gap-2 transition-colors',
                      tempAssignees.includes(u.id)
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">{u.name}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 mt-2">
                <button
                  onClick={handleAssignUsers}
                  disabled={isAssigning}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Users'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && taskToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => {
                setShowDeleteDialog(false);
                setTaskToDelete(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#1a1a1a] rounded-2xl z-50 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Delete Task</h3>
              <p className="text-sm text-white/70 mb-6">
                Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setTaskToDelete(null);
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
