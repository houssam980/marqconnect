import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Trash2, Calendar, Users, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from "@/config/api.config";

interface Task {
  id: string;
  title: string;
  tag: string;
  status: string;
  priority: "Low" | "Medium" | "High";
  date: string;
  assignees: number[];
  assigned_users?: Array<{ id: number; name: string; email: string }>;
  created_by?: { id: number; name: string };
}

interface TaskStatus {
  id: number;
  name: string;
  color: string;
  order: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "text-red-400 bg-red-400/10 border-red-400/20";
    case "Medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "Low": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

function TaskCardContent({ task, onDelete, allUsers = [], isAdmin = false, onTaskClick, onAssign }: { task: Task; onDelete?: (id: string) => void; allUsers?: User[]; isAdmin?: boolean; onTaskClick?: () => void; onAssign?: (taskId: string) => void }) {
  return (
    <>
      <div className="flex justify-between items-start mb-3">
        <Badge 
          variant="outline" 
          className={cn("text-[10px] font-medium border", getPriorityColor(task.priority))}
        >
          {task.priority === "Low" ? "Faible" : task.priority === "Medium" ? "Moyen" : "Haut"}
        </Badge>
        
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                if (onAssign) onAssign(task.id);
              }}>
                <Users className="mr-2 h-4 w-4" />
                Assign to
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(task.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <h4 className="font-medium text-sm text-foreground mb-3 leading-snug">
        {task.title}
      </h4>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{task.date}</span>
        </div>
        
        <div className="flex -space-x-2">
          {task.assigned_users && task.assigned_users.length > 0 ? (
            task.assigned_users.map((assignedUser) => (
              <Avatar key={assignedUser.id} className="w-5 h-5 border border-background">
                <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                  {assignedUser.name[0]}
                </AvatarFallback>
              </Avatar>
            ))
          ) : task.assignees && task.assignees.length > 0 ? (
            task.assignees.map((assigneeId) => {
              const member = allUsers.find(m => m.id === assigneeId);
              if (!member) return null;
              return (
                <Avatar key={assigneeId} className="w-5 h-5 border border-background">
                  <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
              );
            })
          ) : (
            <Users className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
    </>
  );
}

function DraggableTaskCard({ task, onDelete, allUsers = [], isAdmin = false, onTaskClick, onAssign }: { task: Task; onDelete: (id: string) => void; allUsers?: User[]; isAdmin?: boolean; onTaskClick?: () => void; onAssign?: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative p-4 rounded-xl bg-secondary/40 border border-white/5 hover:border-primary/30 hover:bg-secondary/60 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md touch-none",
        isDragging && "opacity-0"
      )}
    >
      <TaskCardContent task={task} onDelete={onDelete} allUsers={allUsers} isAdmin={isAdmin} onTaskClick={onTaskClick} onAssign={onAssign} />
    </div>
  );
}

function DroppableColumn({
  column,
  tasks,
  onDeleteTask,
  allUsers = [],
  isAdmin = false,
  onTaskClick,
  onAssign
}: {
  column: TaskStatus;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  allUsers?: User[];
  isAdmin?: boolean;
  onTaskClick?: (task: Task) => void;
  onAssign?: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.name,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-w-[300px] rounded-2xl bg-card/30 border border-white/5 backdrop-blur-xl overflow-hidden transition-colors duration-200",
        isOver && "bg-primary/5 border-primary/20"
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", column.color)} />
          <h3 className="font-medium text-sm text-foreground">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
            {tasks.map((task) => (
              <DraggableTaskCard 
                key={task.id} 
                task={task} 
                onDelete={onDeleteTask} 
                allUsers={allUsers} 
                isAdmin={isAdmin}
                onTaskClick={() => onTaskClick?.(task)}
                onAssign={onAssign}
              />
            ))}
        
        {tasks.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-xs">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<TaskStatus[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { token, user } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = user?.role === 'admin';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch statuses, tasks, and users on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchStatuses = async () => {
      if (!token || !isMounted) return;
      
      try {
        const response = await fetch(getApiUrl("/task-statuses"), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setColumns(data);
        }
        setColumnsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        if (isMounted) {
          setColumnsLoaded(true);
        }
      }
    };

    const fetchTasks = async () => {
      if (!token || !isMounted) return;

      try {
        const response = await fetch(getApiUrl("/tasks"), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const fetchUsers = async () => {
      if (!token || !isMounted || !isAdmin) return;

      try {
        const response = await fetch(getApiUrl('/users'), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setAllUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    
    const loadData = async () => {
      await fetchStatuses();
      await fetchTasks();
      await fetchUsers();
    };
    
    if (token) {
      loadData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [token, isAdmin]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleAddTask called!', { 
      title: newTaskTitle, 
      priority: newTaskPriority
    });
    
    if (!newTaskTitle.trim()) {
      console.log('Task creation aborted: no title');
      return;
    }

    // Get the first column's name as default status
    const defaultStatus = columns.length > 0 ? columns[0].name : "To Do";
    console.log('Creating task with status:', defaultStatus);

    try {
      const response = await fetch(getApiUrl("/tasks"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: newTaskTitle,
          tag: "General",
          status: defaultStatus,
          priority: newTaskPriority,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          assignees: newTaskAssignees,
          assigned_user_ids: newTaskAssignees, // For backend assignment
        }),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Task created successfully:', data.task);
        setTasks(prev => [...prev, data.task]);
        setNewTaskTitle("");
        setNewTaskPriority("Medium");
        setNewTaskAssignees([]);
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create task:', response.status, errorData);
        throw new Error("Failed to create task");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`/tasks/${id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setTasks(prev => prev.filter((task) => task.id !== id));
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // If dropped over a column
      const overId = over.id as string;
      const activeTask = tasks.find((t) => t.id === active.id);
      
      if (activeTask) {
        // Check if overId is a valid status
        const isValidStatus = columns.some(col => col.name === overId);
        
        if (isValidStatus && activeTask.status !== overId) {
          const newStatus = overId;
          
          // Optimistically update UI
          setTasks(prev => prev.map(t => 
            t.id === active.id 
              ? { ...t, status: newStatus }
              : t
          ));

          // Update on server
          try {
          const response = await fetch(getApiUrl(`/tasks/${active.id}`), {
                  method: "PUT",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                  },
                  body: JSON.stringify({
                    status: newStatus,
                  }),
                });

                // Refresh tasks to get updated data (visible to all admins)
                if (response.ok) {
                  const refreshResponse = await fetch(getApiUrl("/tasks"), {
                    headers: {
                      "Authorization": `Bearer ${token}`,
                      "Accept": "application/json",
                    },
                  });
                  if (refreshResponse.ok) {
                    const refreshedTasks = await refreshResponse.json();
                    setTasks(refreshedTasks);
                  }
                }

            if (!response.ok) {
              throw new Error("Failed to update task");
            }
          } catch (error) {
            console.error("Failed to update task:", error);
            // Revert on error
            setTasks(prev => prev.map(t => 
              t.id === active.id 
                ? activeTask
                : t
            ));
            toast({
              title: "Error",
              description: "Failed to update task status",
              variant: "destructive",
            });
          }
        }
      }
    }

    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  // Debug logging
  console.log('TaskBoard Debug:', {
    isLoading,
    columnsLoaded,
    columnsCount: columns.length,
    tasksCount: tasks.length,
    token: token ? 'exists' : 'missing'
  });

  // Loading state
  if (isLoading || !columnsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!columns || columns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No task columns configured</p>
          <p className="text-xs text-muted-foreground/60">Task columns will be created automatically</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Columns loaded: {columnsLoaded ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext 
        key="task-board-dnd"
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Task Board</h2>
            {!isAdmin && (
              <p className="text-sm text-muted-foreground mt-1">
                Viewing tasks assigned to you
              </p>
            )}
          </div>
          
          {isAdmin && columnsLoaded && columns.length > 0 && (
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl bg-card/30 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-secondary/30 border-white/5 focus-visible:ring-primary min-w-[200px]"
              />
              
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as "Low" | "Medium" | "High")}
                className="flex h-9 w-[110px] items-center justify-between rounded-md border border-primary/30 bg-secondary/30 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <option value="Low" className="bg-card text-foreground">Faible</option>
                <option value="Medium" className="bg-card text-foreground">Moyen</option>
                <option value="High" className="bg-card text-foreground">Haut</option>
              </select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-between bg-secondary/30 border-white/5 font-normal px-3 z-10" style={{ zIndex: 10 }}>
                  <span className="truncate">
                    {newTaskAssignees.length > 0 
                      ? `${newTaskAssignees.length} assigned` 
                      : "Attribuer"}
                  </span>
                  <Users className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-white/10 z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
                <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <ScrollArea className="max-h-[300px]">
                  {allUsers.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p>No team members</p>
                    </div>
                  ) : (
                    allUsers.filter(u => u.role === 'user').map((member) => (
                      <DropdownMenuCheckboxItem
                        key={member.id}
                        checked={newTaskAssignees.includes(member.id)}
                        onCheckedChange={(checked) => {
                          setNewTaskAssignees(prev => 
                            checked 
                              ? [...prev, member.id]
                              : prev.filter(id => id !== member.id)
                          );
                        }}
                        className="focus:bg-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button type="submit" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 overflow-x-auto pb-4">
          {columns.map((column) => (
            <DroppableColumn
              key={`column-${column.id}`}
              column={column}
              tasks={tasks.filter((t) => t.status === column.name)}
              onDeleteTask={handleDeleteTask}
              allUsers={allUsers}
              isAdmin={isAdmin}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setIsTaskDetailsOpen(true);
              }}
              onAssign={(taskId) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  setTaskToAssign(task);
                  setIsAssignDialogOpen(true);
                }
              }}
            />
          ))}
        </div>

        {activeTask && (
          <DragOverlay>
            <div className="p-4 rounded-xl bg-secondary/80 border border-primary/50 shadow-2xl cursor-grabbing backdrop-blur-md w-[300px] rotate-2">
              <TaskCardContent task={activeTask} allUsers={allUsers} isAdmin={isAdmin} />
            </div>
          </DragOverlay>
        )}
        </div>
      </DndContext>

      {/* Task Details Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
          <DialogContent className="bg-card border-white/10 z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
              <DialogDescription>
                View assigned users and task information
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-xs", getPriorityColor(selectedTask.priority))}>
                      {selectedTask.priority === "Low" ? "Faible" : selectedTask.priority === "Medium" ? "Moyen" : "Haut"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{selectedTask.status}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assigned Users
                  </h4>
                  {selectedTask.assigned_users && selectedTask.assigned_users.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTask.assigned_users.map((assignedUser) => (
                        <div key={assignedUser.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {assignedUser.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {assignedUser.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3" />
                              {assignedUser.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm">No users assigned</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Task Dialog */}
      {isAssignDialogOpen && taskToAssign && (
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Task: {taskToAssign.title}</DialogTitle>
              <DialogDescription>
                Select users to assign this task to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {allUsers.filter(u => u.role !== 'admin').map((user) => {
                const isAssigned = taskToAssign.assigned_users?.some(au => au.id === user.id) || taskToAssign.assignees?.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isAssigned
                        ? "bg-primary/10 border-primary/50"
                        : "bg-secondary/30 border-white/5 hover:bg-secondary/50"
                    )}
                    onClick={async () => {
                      try {
                        const response = await fetch(getApiUrl(`/tasks/${taskToAssign.id}/assign`), {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                          },
                          body: JSON.stringify({
                            user_id: user.id,
                            action: isAssigned ? 'remove' : 'add',
                          }),
                        });

                        if (response.ok) {
                          const updatedTask = await response.json();
                          setTasks((prev) => prev.map((t) => (t.id === taskToAssign.id ? updatedTask : t)));
                          setTaskToAssign(updatedTask);
                          toast({
                            title: isAssigned ? "User unassigned" : "User assigned",
                            description: `${user.name} ${isAssigned ? 'removed from' : 'assigned to'} task`,
                          });
                        } else {
                          throw new Error('Failed to assign user');
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update assignment",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {isAssigned && (
                      <Badge variant="default" className="text-xs">Assigned</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
