import React, { useState, useEffect, useRef } from "react";
import { DashboardCard } from "../DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MoreHorizontal, Send, CheckSquare, UserPlus, X, Users, FolderPlus, Folder, Trash2, Edit2, Image as ImageIcon, Download, Paperclip, Briefcase, MessageSquare, AlertTriangle } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import echo, { initializeEcho } from "@/lib/echo";
import { cn } from "@/lib/utils";
import { ProjectBoarding } from "./ProjectBoarding";
import { getApiUrl } from "@/config/api.config";

interface Message {
  id: number;
  user: string;
  user_id: number;
  content: string;
  time: string;
  created_at: string;
  document?: {
    id: number;
    name: string;
    file_type: string;
    file_size: number;
    url: string;
  };
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  creator?: { id: number; name: string; email: string };
  members?: Array<{ id: number; name: string; email: string }>;
}

interface Document {
  id: number;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  url?: string;
}

export function ProjectSpace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  
  // Create project form
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  
  // Edit project form
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const shouldAutoScrollRef = useRef(true);
  const { token, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Fetch projects
  useEffect(() => {
    if (token) {
      fetchProjects();
      if (isAdmin) {
        fetchAllUsers();
      }
    }
  }, [token, isAdmin]);

  // Fetch project data when selected
  useEffect(() => {
    if (selectedProject && token) {
      fetchMessages();
      fetchDocuments();
      
      // Initialize Echo with current token
      const currentEcho = initializeEcho();
      
      // Setup Pusher for project chat
      if (currentEcho) {
        try {
          const channel = currentEcho.join(`chat.project-${selectedProject.id}`);
          
          channel.listen('.message.sent', (e: any) => {
            console.log('New message received via Pusher:', e);
            const newMessage = e.message || e.data;
            
            if (e.space === `project-${selectedProject.id}` || newMessage) {
              // Check for duplicates before adding
              setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                // Limit to last 200 messages to prevent memory leak
                const updated = [...prev, newMessage];
                return updated.length > 200 ? updated.slice(-200) : updated;
              });
            }
          });

          console.log('Pusher listener set up for project chat');
        } catch (error) {
          console.warn('Pusher failed, using polling:', error);
        }
      }
      
      // Poll every 3 seconds (reduced from 1.5s for better performance)
      const interval = setInterval(() => {
        fetchNewMessages();
      }, 3000);

      return () => {
        clearInterval(interval);
        if (currentEcho) {
          try {
            currentEcho.leave(`chat.project-${selectedProject.id}`);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
    }
  }, [selectedProject, token]);

  // Auto-scroll to bottom when new messages arrive (only if user is already at bottom)
  useEffect(() => {
    if (messagesContainerRef.current && shouldAutoScrollRef.current) {
      // Small delay to ensure DOM is updated
      requestAnimationFrame(() => {
        if (messagesContainerRef.current && shouldAutoScrollRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [messages]);

  // Load images with authentication
  useEffect(() => {
    const loadImages = async () => {
      const imageMessages = messages.filter(
        msg => msg.document && msg.document.file_type?.startsWith('image/')
      );
      
      for (const msg of imageMessages) {
        if (!msg.document || imageUrls[msg.document.id]) continue;
        
        try {
          const response = await fetch(getApiUrl(`/documents/${msg.document.id}/download`), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageUrls(prev => ({ ...prev, [msg.document!.id]: url }));
          }
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
    };
    
    if (messages.length > 0 && token) {
      loadImages();
    }
  }, [messages, token]);

  // Track scroll position to determine if we should auto-scroll
  useEffect(() => {
    if (!messagesContainerRef.current || !selectedProject) return;
    
    const scrollContainer = messagesContainerRef.current;

    const handleScroll = () => {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    };

    // Initial check
    handleScroll();
    
    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [selectedProject, messages.length]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(getApiUrl("/projects"), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchAllUsers = async () => {
    if (!isAdmin) return; // Only admins can fetch users
    
    try {
      const response = await fetch(getApiUrl('/users'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      } else if (response.status === 500) {
        const errorText = await response.text();
        // Only log once to avoid spam
        if (!(window as any).__usersErrorLogged) {
          (window as any).__usersErrorLogged = true;
          console.error(`❌ [Users] 500 Error on /api/users`);
          console.error(`❌ [Users] Response:`, errorText.substring(0, 200));
          console.error(`❌ [Users] Check Laravel logs: C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log`);
          console.warn('⚠️ [Users] Backend endpoint might not exist or has errors');
        }
        // Set empty array to prevent UI crash
        setAllUsers([]);
      } else if (response.status === 403) {
        // User is not admin, which is expected for non-admin users
        console.warn('⚠️ [Users] User is not admin, cannot fetch users list');
        setAllUsers([]);
      }
    } catch (error) {
      console.error("❌ [Users] Fetch error:", error);
      setAllUsers([]);
    }
  };

  const fetchMessages = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(getApiUrl(`/messages/project-${selectedProject.id}`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Sort messages by created_at ascending (oldest first at top)
        const sortedMessages = Array.isArray(data) 
          ? [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          : [];
        setMessages(sortedMessages);
      } else if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this project",
          variant: "destructive",
        });
      } else if (response.status === 500) {
        const errorText = await response.text();
        // Only log once to avoid spam
        if (!(window as any).__projectMessagesErrorLogged) {
          (window as any).__projectMessagesErrorLogged = true;
          console.error(`❌ [Project Messages] 500 Error on /api/messages/project-${selectedProject.id}`);
          console.error(`❌ [Project Messages] Response:`, errorText.substring(0, 200));
          console.error(`❌ [Project Messages] Check Laravel logs: C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log`);
          console.warn('⚠️ [Project Messages] Backend endpoint might not exist or has errors');
          toast({
            title: "Error loading messages",
            description: "Server error. Check console for details.",
            variant: "destructive",
          });
        }
        // Set empty messages array to prevent UI crash
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ [Project Messages] Fetch error:", error);
      toast({
        title: "Error loading messages",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      setMessages([]);
    }
  };

  const fetchNewMessages = async () => {
    if (!selectedProject || !token) return;

    try {
      const currentMessages = messagesRef.current;
      let url = getApiUrl(`/messages/project-${selectedProject.id}/new`);
      
      // If we have messages, fetch only new ones
      if (currentMessages.length > 0) {
        const lastMessage = currentMessages[currentMessages.length - 1];
        url += `?since=${lastMessage.created_at}`;
      } else {
        // If no messages, fetch all to initialize
        await fetchMessages();
        return;
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Check for duplicates before adding
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.filter((m: Message) => !existingIds.has(m.id));
            
            if (newMessages.length > 0) {
              console.log(`Adding ${newMessages.length} new messages to project chat`);
              // Limit to last 200 messages to prevent memory leak
              const updated = [...prev, ...newMessages];
              return updated.length > 200 ? updated.slice(-200) : updated;
            }
            return prev;
          });
        }
      } else if (response.status === 500) {
        const errorText = await response.text();
        // Only log once to avoid spam
        if (!(window as any).__projectNewMessagesErrorLogged) {
          (window as any).__projectNewMessagesErrorLogged = true;
          console.error(`❌ [Project Messages] 500 Error on ${url}`);
          console.error(`❌ [Project Messages] Response:`, errorText.substring(0, 200));
          console.error(`❌ [Project Messages] Check Laravel logs: C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log`);
          console.warn('⚠️ [Project Messages] Backend endpoint might not exist or has errors');
          console.warn('⚠️ [Project Messages] Falling back to full message fetch');
        }
        // Fallback: fetch all messages instead of new ones
        await fetchMessages();
      }
    } catch (error) {
      console.error("❌ [Project Messages] Fetch error:", error);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}/documents`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else if (response.status === 500) {
        const errorText = await response.text();
        // Only log once to avoid spam
        if (!(window as any).__documentsErrorLogged) {
          (window as any).__documentsErrorLogged = true;
          console.error(`❌ [Documents] 500 Error on /api/projects/${selectedProject.id}/documents`);
          console.error(`❌ [Documents] Response:`, errorText.substring(0, 200));
          console.error(`❌ [Documents] Check Laravel logs: C:\\wamp64\\www\\marqconnect_backend\\storage\\logs\\laravel.log`);
          console.warn('⚠️ [Documents] Backend endpoint might not exist or has errors');
        }
        // Set empty documents array to prevent UI crash
        setDocuments([]);
      }
    } catch (error) {
      console.error("❌ [Documents] Fetch error:", error);
      setDocuments([]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch(getApiUrl("/projects"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => [data.project, ...prev]);
        setSelectedProject(data.project);
        setNewProjectName("");
        setNewProjectDescription("");
        setIsCreateProjectOpen(false);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      } else {
        throw new Error("Failed to create project");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleInviteUsers = async () => {
    if (!selectedProject || selectedMembers.length === 0) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}/invite`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          user_ids: selectedMembers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh project to get updated members
        fetchProjects();
        setSelectedMembers([]);
        setIsInviteOpen(false);
        toast({
          title: "Success",
          description: "Users invited successfully",
        });
      } else {
        throw new Error("Failed to invite users");
      }
    } catch (error) {
      console.error("Failed to invite users:", error);
      toast({
        title: "Error",
        description: "Failed to invite users",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isSending || !selectedProject) return;

    setIsSending(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('content', newMessage);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(getApiUrl(`/messages/project-${selectedProject.id}`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // When user sends a message, always scroll to bottom
        shouldAutoScrollRef.current = true;
        // Add message immediately to UI
        setMessages(prev => {
          // Check for duplicates
          const exists = prev.some(m => m.id === result.data.id);
          if (exists) return prev;
          // Limit to last 200 messages to prevent memory leak
          const updated = [...prev, result.data];
          return updated.length > 200 ? updated.slice(-200) : updated;
        });
        setNewMessage("");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchDocuments(); // Refresh documents list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleClearChat = async () => {
    if (!selectedProject) return;
    
    if (!confirm('⚠️ Are you sure you want to clear all messages in this project? This action cannot be undone and will permanently delete all chat history from the database.')) {
      return;
    }

    try {
// Use GET with action parameter to bypass firewall blocking DELETE/POST
    const response = await fetch(getApiUrl(`/messages/project-${selectedProject.id}?action=clear`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      });

      if (!response.ok) {
        throw new Error('Failed to clear messages');
      }

      setMessages([]);
      toast({
        title: "Success",
        description: "All messages cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing messages:', error);
      toast({
        title: "Error",
        description: "Failed to clear messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editProjectName.trim()) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}`), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: editProjectName,
          description: editProjectDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? data.project : p));
        setSelectedProject(data.project);
        setIsEditProjectOpen(false);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${selectedProject.id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
        setSelectedProject(null);
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  // Update edit form when project changes
  useEffect(() => {
    if (selectedProject) {
      setEditProjectName(selectedProject.name);
      setEditProjectDescription(selectedProject.description || "");
    }
  }, [selectedProject]);

  const toggleMember = (id: number) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Get available members (users not already in project)
  const availableMembers = selectedProject
    ? allUsers.filter(user => 
        !selectedProject.members?.some(m => m.id === user.id) && 
        user.id !== selectedProject.created_by
      )
    : allUsers;

  return (
    <div className="h-full flex gap-6">
      {/* Projects Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between z-10" style={{ zIndex: 10 }}>
          <h3 className="text-lg font-semibold">Projects</h3>
          {isAdmin && (
            <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Create a new project and invite team members.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="My Project"
                      className="bg-secondary/30 border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-desc">Description (Optional)</Label>
                    <Input
                      id="project-desc"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Project description..."
                      className="bg-secondary/30 border-white/10"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Project
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Folder className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No projects yet</p>
                {isAdmin && (
                  <p className="text-xs mt-1">Create one to get started</p>
                )}
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedProject?.id === project.id
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-secondary/30 border border-white/5 hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      {project.members && (
                        <p className="text-xs text-muted-foreground">
                          {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      {selectedProject ? (
        <>
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex items-center justify-between shrink-0 z-10" style={{ zIndex: 10 }}>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">{selectedProject.name}</h2>
              {selectedProject.description && (
                <p className="text-muted-foreground">{selectedProject.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-white text-black border-white/10 hover:bg-red-500 hover:text-white hover:border-red-500">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-white/10 z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
                      <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                          Update project name and description.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEditProject} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-project-name">Project Name</Label>
                          <Input
                            id="edit-project-name"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            placeholder="My Project"
                            className="bg-secondary/30 border-white/10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-project-desc">Description (Optional)</Label>
                          <Input
                            id="edit-project-desc"
                            value={editProjectDescription}
                            onChange={(e) => setEditProjectDescription(e.target.value)}
                            placeholder="Project description..."
                            className="bg-secondary/30 border-white/10"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setIsEditProjectOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    className="border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-400"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </>
              )}
              {isAdmin && (
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 z-10" style={{ zIndex: 10 }}>
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Members
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10 z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
                  <DialogHeader>
                    <DialogTitle>Invite Team Members</DialogTitle>
                    <DialogDescription>
                      Select members to invite to this project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <Input placeholder="Search members..." className="bg-secondary/30 border-white/5" />
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-2">
                        {availableMembers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Users className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">No members available</p>
                            <p className="text-xs mt-1">All users are already in this project</p>
                          </div>
                        ) : (
                          availableMembers.map((member) => (
                            <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                              <Checkbox 
                                id={`member-${member.id}`} 
                                checked={selectedMembers.includes(member.id)}
                                onCheckedChange={() => toggleMember(member.id)}
                                className="border-white/20"
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <label
                                  htmlFor={`member-${member.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {member.name}
                                </label>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                    <Button onClick={handleInviteUsers} disabled={selectedMembers.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Send Invites ({selectedMembers.length})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>

          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start bg-secondary/30 border-b border-white/5 z-10">
              <TabsTrigger value="chat" className="gap-2 z-10">
                <MessageSquare className="w-4 h-4" />
                Project Chat
              </TabsTrigger>
              <TabsTrigger value="boarding" className="gap-2 z-10">
                <Briefcase className="w-4 h-4" />
                Boarding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 mt-6 min-h-0">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Chat Section */}
                <div className="lg:col-span-2">
                  <DashboardCard 
                    title="Project Chat" 
                    className="h-full"
                    action={
                      <div className="flex items-center gap-3" style={{ zIndex: 10, position: 'relative' }}>
                        {user?.role === 'admin' && (
                          <>
                            <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Recommend clearing every 2 weeks for better performance</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearChat}
                              className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              title="Clear all messages"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Clear Chat
                            </Button>
                          </>
                        )}
                      </div>
                    }
                  >
                {/* Chat Container - Absolute positioning for perfect control */}
                <div className="relative" style={{ height: 'calc(100vh - 320px)' }}>
                  {/* Messages Container - SCROLLABLE */}
                  <div 
                    ref={messagesContainerRef}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden border border-border/30 rounded-lg bg-background/50" 
                    style={{ 
                      scrollBehavior: 'smooth',
                      height: 'calc(100% - 70px)'
                    }}
                  >
                    <div className="px-4 py-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Send className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Start a conversation with your team</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarFallback className="text-sm font-semibold">{msg.user[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                              <div className={`flex items-center gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                                <span className="font-semibold text-sm">{msg.user}</span>
                                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                              </div>
                              {msg.content && (
                                <div className={`px-4 py-2 rounded-2xl ${
                                  msg.user_id === user?.id 
                                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                    : 'bg-secondary text-foreground rounded-tl-none'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                              )}
                              {msg.document && (
                                <div className={`mt-2 p-3 rounded-xl border ${
                                  msg.user_id === user?.id 
                                    ? 'bg-primary/10 border-primary/30' 
                                    : 'bg-secondary/20 border-border'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    {msg.document.file_type?.startsWith('image/') ? (
                                      <ImageIcon className="w-8 h-8 text-primary shrink-0" />
                                    ) : (
                                      <FileText className="w-8 h-8 text-primary shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{msg.document.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(msg.document.file_size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 shrink-0"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(getApiUrl(`/documents/${msg.document.id}/download`), {
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                            },
                                          });
                                          if (response.ok) {
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = msg.document.name;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                          }
                                        } catch (error) {
                                          console.error('Download failed:', error);
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  {msg.document.file_type?.startsWith('image/') && imageUrls[msg.document.id] && (
                                    <img 
                                      src={imageUrls[msg.document.id]}
                                      alt={msg.document.name}
                                      className="mt-2 rounded-lg max-w-full max-h-64 object-contain"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={scrollRef} />
                      </>
                    )}
                    </div>
                  </div>

                  {/* Message Input - Absolute positioned at bottom */}
                  <form 
                    onSubmit={handleSendMessage} 
                    className="absolute bottom-0 left-0 right-0 space-y-2"
                    style={{ height: selectedFile ? '120px' : '70px' }}
                  >
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-xl border border-border/50">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs flex-1 truncate font-medium">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 rounded-full hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedFile(null);
                            // Reset file input
                            const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="chat-file-upload"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-full hover:bg-secondary"
                        onClick={() => document.getElementById('chat-file-upload')?.click()}
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input 
                        placeholder="Saisissez un message..." 
                        className="bg-secondary/50 border-border/50 focus-visible:ring-primary h-12 rounded-full px-6 flex-1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if ((newMessage.trim() || selectedFile) && !isSending && selectedProject) {
                              handleSendMessage(e);
                            }
                          }
                        }}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50" 
                        disabled={isSending || (!newMessage.trim() && !selectedFile)}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </form>
                </div>
              </DashboardCard>
            </div>

            {/* Sidebar: Members */}
            <div className="h-full flex flex-col">
              <DashboardCard title="Members" className="h-full flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4">
                    {selectedProject.members && selectedProject.members.length > 0 ? (
                      selectedProject.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">No members yet</p>
                        {isAdmin && (
                          <p className="text-xs">Invite users to get started</p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DashboardCard>
            </div>
          </div>
            </TabsContent>

            <TabsContent value="boarding" className="flex-1 mt-6 min-h-0">
              <ProjectBoarding 
                projectId={selectedProject.id} 
                projectMembers={selectedProject.members || []} 
              />
            </TabsContent>
          </Tabs>
        </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-semibold mb-2">No Project Selected</h3>
            <p className="text-muted-foreground">
              {projects.length === 0 
                ? (isAdmin ? "Create a project to get started" : "No projects available")
                : "Select a project from the sidebar"}
            </p>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{selectedProject?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                handleDeleteProject();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
