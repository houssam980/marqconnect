import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  X,
  Upload,
  FileText,
  Link as LinkIcon,
  StickyNote,
  ExternalLink,
  Trash2,
  Download,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';
import { requestStoragePermission } from '@/utils/permissions';

interface BoardingTask {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_to_user?: { id: number; name: string; email: string };
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

interface BoardingDocument {
  id: number;
  name: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  uploader?: { id: number; name: string; email: string };
  created_at: string;
  url?: string;
}

interface BoardingLink {
  id: number;
  title: string;
  url: string;
  description: string;
  type: 'helper' | 'inspiration';
  created_by: number;
  creator?: { id: number; name: string; email: string };
  created_at: string;
}

interface BoardingNote {
  id: number;
  content: string;
  color: string;
  created_by: number;
  creator?: { id: number; name: string; email: string };
  created_at: string;
}

interface MobileBoardingProps {
  projectId: number;
  projectMembers: Array<{ id: number; name: string; email: string }>;
}

export default function MobileBoarding({ projectId, projectMembers }: MobileBoardingProps) {
  const [tasks, setTasks] = useState<BoardingTask[]>([]);
  const [documents, setDocuments] = useState<BoardingDocument[]>([]);
  const [links, setLinks] = useState<BoardingLink[]>([]);
  const [notes, setNotes] = useState<BoardingNote[]>([]);
  
  const [showTaskSheet, setShowTaskSheet] = useState(false);
  const [showDocSheet, setShowDocSheet] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState<number | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkType, setLinkType] = useState<'helper' | 'inspiration'>('helper');
  
  const [noteContent, setNoteContent] = useState('');
  
  const { token, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && token) {
      fetchTasks();
      fetchDocuments();
      fetchLinks();
      fetchNotes();
    }
  }, [projectId, token]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/tasks`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/links`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/notes`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskAssignedTo) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/tasks`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          assigned_to: taskAssignedTo,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        setTaskTitle('');
        setTaskDescription('');
        setTaskAssignedTo(null);
        setShowTaskSheet(false);
        toast({ title: 'Success', description: 'Task created' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/tasks/${taskId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        toast({ title: 'Success', description: 'Task updated' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/tasks/${taskId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        toast({ title: 'Success', description: 'Task deleted' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'Error', description: 'File too large (max 200MB)', variant: 'destructive' });
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      toast({ title: 'Permission Required', description: 'Storage permission needed', variant: 'destructive' });
      return;
    }

    setSelectedFile(file);
    setShowDocSheet(true);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    if (docDescription) {
      formData.append('description', docDescription);
    }

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments(prev => [newDoc, ...prev]);
        setSelectedFile(null);
        setDocDescription('');
        setShowDocSheet(false);
        toast({ title: 'Success', description: 'Document uploaded' });
        fetchDocuments();
      } else {
        const error = await response.json();
        toast({ title: 'Upload failed', description: error.message || 'Try again', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Delete this document?')) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents/${docId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({ title: 'Success', description: 'Document deleted' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleCreateLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/links`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: linkTitle,
          url: linkUrl,
          description: linkDescription,
          type: linkType,
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setLinks(prev => [newLink, ...prev]);
        setLinkTitle('');
        setLinkUrl('');
        setLinkDescription('');
        setShowLinkSheet(false);
        toast({ title: 'Success', description: 'Link added' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add link', variant: 'destructive' });
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('Delete this link?')) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/links/${linkId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setLinks(prev => prev.filter(link => link.id !== linkId));
        toast({ title: 'Success', description: 'Link deleted' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/notes`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: noteContent,
          color: 'default',
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        setNoteContent('');
        setShowNoteSheet(false);
        toast({ title: 'Success', description: 'Note created' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create note', variant: 'destructive' });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/notes/${noteId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast({ title: 'Success', description: 'Note deleted' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const helperLinks = links.filter(link => link.type === 'helper');
  const inspirationLinks = links.filter(link => link.type === 'inspiration');

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {/* Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Tasks
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTaskSheet(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {task.assigned_to_user && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          {task.assigned_to_user.name}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-6 w-6 p-0 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={task.status === 'pending' ? 'secondary' : 'outline'}
                      onClick={() => handleTaskStatusChange(task.id, 'pending')}
                      className="flex-1 h-7 text-xs"
                    >
                      <Circle className="w-3 h-3 mr-1" />
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={task.status === 'in_progress' ? 'secondary' : 'outline'}
                      onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                      className="flex-1 h-7 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={task.status === 'completed' ? 'secondary' : 'outline'}
                      onClick={() => handleTaskStatusChange(task.id, 'completed')}
                      className="flex-1 h-7 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Done
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-secondary/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Documents
            </h3>
            <label>
              <input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </label>
          </div>
          
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No documents yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background/50 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Download className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="h-7 w-7 p-0 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Helper Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-secondary/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-400" />
              Helper Resources
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLinkType('helper');
                setShowLinkSheet(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {helperLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No helper links yet</p>
          ) : (
            <div className="space-y-2">
              {helperLinks.map(link => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background/50 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{link.title}</p>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-7 w-7 p-0 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Inspiration Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-pink-400" />
              Inspiration
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLinkType('inspiration');
                setShowLinkSheet(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {inspirationLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No inspiration links yet</p>
          ) : (
            <div className="space-y-2">
              {inspirationLinks.map(link => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background/50 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{link.title}</p>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-7 w-7 p-0 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary/30 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-yellow-400" />
              Notes
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNoteSheet(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-yellow-500/10 rounded-lg p-3 flex items-start justify-between gap-2"
                >
                  <p className="text-sm flex-1">{note.content}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-6 w-6 p-0 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Task Sheet */}
      <AnimatePresence>
        {showTaskSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">New Task</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTaskSheet(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title"
                    className="bg-secondary/30"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Task description..."
                    className="bg-secondary/30"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign To</label>
                  <select
                    value={taskAssignedTo || ''}
                    onChange={(e) => setTaskAssignedTo(Number(e.target.value))}
                    className="w-full bg-secondary/30 border border-white/10 rounded-lg p-3 text-foreground"
                  >
                    <option value="">Select member...</option>
                    {projectMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={handleCreateTask}
                  className="w-full"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Upload Sheet */}
      <AnimatePresence>
        {showDocSheet && selectedFile && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">Upload Document</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowDocSheet(false);
                    setSelectedFile(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">File:</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                  <Textarea
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Document description..."
                    className="bg-secondary/30"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={handleUploadDocument}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Sheet */}
      <AnimatePresence>
        {showLinkSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">
                  Add {linkType === 'helper' ? 'Helper Resource' : 'Inspiration Link'}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLinkSheet(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Link title"
                    className="bg-secondary/30"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">URL</label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-secondary/30"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                  <Textarea
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    placeholder="Link description..."
                    className="bg-secondary/30"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={handleCreateLink}
                  className="w-full"
                >
                  Add Link
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Sheet */}
      <AnimatePresence>
        {showNoteSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">New Note</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNoteSheet(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note..."
                  className="bg-secondary/30 h-full min-h-[200px]"
                />
              </div>
              
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={handleCreateNote}
                  className="w-full"
                >
                  Create Note
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
