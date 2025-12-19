import React, { useState, useEffect } from "react";
import { DashboardCard } from "../DashboardCard";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/config/api.config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Link as LinkIcon, 
  Upload, 
  Trash2, 
  Edit2, 
  Download,
  ExternalLink,
  CheckSquare,
  Plus,
  X,
  Lightbulb,
  Paperclip,
  Briefcase,
  StickyNote,
  Layers
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface BoardingTask {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_to_user?: { id: number; name: string; email: string };
  created_by: number;
  creator?: { id: number; name: string; email: string };
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  project_id: number;
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
  project_id: number;
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
  project_id: number;
}

interface BoardingNote {
  id: number;
  content: string;
  color: string;
  created_by: number;
  creator?: { id: number; name: string; email: string };
  created_at: string;
  project_id: number;
}

interface ProjectBoardingProps {
  projectId: number;
  projectMembers: Array<{ id: number; name: string; email: string }>;
}

export function ProjectBoarding({ projectId, projectMembers }: ProjectBoardingProps) {
  const [tasks, setTasks] = useState<BoardingTask[]>([]);
  const [documents, setDocuments] = useState<BoardingDocument[]>([]);
  const [links, setLinks] = useState<BoardingLink[]>([]);
  const [notes, setNotes] = useState<BoardingNote[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [newCardName, setNewCardName] = useState("");
  const [newCardType, setNewCardType] = useState<'notes' | 'documents' | 'links' | 'custom'>('custom');
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isDocumentViewOpen, setIsDocumentViewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<BoardingDocument | null>(null);
  const [documentDescription, setDocumentDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState<number | null>(null);
  
  // Link form
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkType, setLinkType] = useState<'helper' | 'inspiration'>('helper');
  
  const { token, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  // Fetch boarding data
  useEffect(() => {
    if (projectId && token) {
      fetchTasks();
      fetchDocuments();
      fetchLinks();
      fetchNotes();
      fetchCustomCards();
    }
  }, [projectId, token]);

  const fetchCustomCards = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Only get custom cards (not default ones)
        const customs = data.filter((c: any) => !c.is_default);
        setCustomCards(customs);
      }
    } catch (error) {
      console.error('Error fetching custom cards:', error);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCardName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a card name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name: newCardName,
          type: newCardType,
          icon: getCardIcon(newCardType),
          color: getCardColor(newCardType)
        }),
      });

      if (response.ok) {
        const newCard = await response.json();
        setCustomCards(prev => [...prev, newCard]);
        setNewCardName("");
        setNewCardType('custom');
        setIsCreateCardOpen(false);
        toast({
          title: "Success",
          description: "Card created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to delete this card and all its items?')) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards/${cardId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setCustomCards(prev => prev.filter(c => c.id !== cardId));
        toast({
          title: "Success",
          description: "Card deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive",
      });
    }
  };

  const handleCreateCustomItem = async (cardId: number) => {
    if (!newCustomItem.trim()) return;

    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards/${cardId}/items`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ content: newCustomItem }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setCustomCards(prev => prev.map(card => {
          if (card.id === cardId) {
            return { ...card, items: [newItem, ...(card.items || [])] };
          }
          return card;
        }));
        setNewCustomItem("");
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }
    } catch (error) {
      console.error('Error creating custom item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomItem = async (cardId: number, itemId: number) => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards/${cardId}/items/${itemId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setCustomCards(prev => prev.map(card => {
          if (card.id === cardId) {
            return { ...card, items: card.items?.filter(item => item.id !== itemId) || [] };
          }
          return card;
        }));
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting custom item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleUploadToCard = async (cardId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', file.name);

      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/cards/${cardId}/items`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const newItem = await response.json();
        setCustomCards(prev => prev.map(card => {
          if (card.id === cardId) {
            return { ...card, items: [newItem, ...(card.items || [])] };
          }
          return card;
        }));
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

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
        console.log('Documents fetched:', data);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskTitle.trim() || !taskAssignedTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
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
        setTaskTitle("");
        setTaskDescription("");
        setTaskAssignedTo(null);
        setIsTaskDialogOpen(false);
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
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
        toast({
          title: "Success",
          description: "Task status updated",
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
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
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (200MB = 200 * 1024 * 1024 bytes)
      const maxSize = 200 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 200MB. Please select a smaller file.",
          variant: "destructive",
        });
        // Reset file input
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setIsDocumentDialogOpen(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Double-check file size before upload
    const maxSize = 200 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 200MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    if (documentDescription) {
      formData.append('description', documentDescription);
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Use XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
      });

      // Configure and send request
      xhr.open('POST', getApiUrl(`/projects/${projectId}/boarding/documents`));
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(formData);

      // Wait for upload to complete
      const newDocument = await uploadPromise;
      
      console.log('New document uploaded:', newDocument);
      setDocuments(prev => [newDocument, ...prev]);
      setIsDocumentDialogOpen(false);
      setSelectedFile(null);
      setDocumentDescription("");
      setUploadProgress(0);
      setIsUploading(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
      // Refresh document list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Parse error message if it's JSON
      let errorMessage = "Failed to upload document";
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && errorData.errors.document) {
          errorMessage = errorData.errors.document[0];
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkTitle.trim() || !linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and URL",
        variant: "destructive",
      });
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
        setLinkTitle("");
        setLinkUrl("");
        setLinkDescription("");
        setIsLinkDialogOpen(false);
        toast({
          title: "Success",
          description: "Link added successfully",
        });
      } else {
        throw new Error('Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: "Failed to create link",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents/${documentId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast({
          title: "Success",
          description: "Document deleted",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (linkId: number) => {
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
        toast({
          title: "Success",
          description: "Link deleted",
        });
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  // NOTES Functions
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
        setNoteContent("");
        toast({
          title: "Success",
          description: "Note created",
        });
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
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
        toast({
          title: "Success",
          description: "Note deleted",
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  // Clear all handlers
  const handleClearAllTasks = async () => {
    if (!confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) return;
    
    try {
      const deletePromises = tasks.map(task => 
        fetch(getApiUrl(`/projects/${projectId}/boarding/tasks/${task.id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      );
      
      await Promise.all(deletePromises);
      setTasks([]);
      toast({
        title: "Success",
        description: "All tasks cleared",
      });
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to clear all tasks",
        variant: "destructive",
      });
    }
  };

  const handleClearAllDocuments = async () => {
    if (!confirm('Are you sure you want to delete all documents? This action cannot be undone.')) return;
    
    try {
      const deletePromises = documents.map(doc => 
        fetch(getApiUrl(`/projects/${projectId}/boarding/documents/${doc.id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      );
      
      await Promise.all(deletePromises);
      setDocuments([]);
      toast({
        title: "Success",
        description: "All documents cleared",
      });
    } catch (error) {
      console.error('Error clearing documents:', error);
      toast({
        title: "Error",
        description: "Failed to clear all documents",
        variant: "destructive",
      });
    }
  };

  const handleClearAllLinks = async (category: 'helper' | 'inspiration') => {
    const categoryName = category === 'helper' ? 'helper resources' : 'inspiration links';
    const linksToDelete = links.filter(link => link.type === category);
    
    console.log(`[handleClearAllLinks] Attempting to clear ${linksToDelete.length} ${categoryName}`);
    
    if (linksToDelete.length === 0) {
      toast({
        title: "Info",
        description: `No ${categoryName} to clear`,
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete all ${linksToDelete.length} ${categoryName}? This action cannot be undone.`)) {
      console.log('[handleClearAllLinks] User canceled');
      return;
    }
    
    try {
      console.log(`[handleClearAllLinks] Starting deletion of ${linksToDelete.length} links`);
      
      const deletePromises = linksToDelete.map(async link => {
        console.log(`[handleClearAllLinks] Deleting link ${link.id}: ${link.title}`);
        const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/links/${link.id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`[handleClearAllLinks] Failed to delete link ${link.id}:`, response.status, response.statusText);
          throw new Error(`Failed to delete link ${link.id}`);
        }
        
        console.log(`[handleClearAllLinks] Successfully deleted link ${link.id}`);
        return response;
      });
      
      await Promise.all(deletePromises);
      
      console.log(`[handleClearAllLinks] All ${linksToDelete.length} links deleted successfully`);
      setLinks(prev => prev.filter(link => link.type !== category));
      
      toast({
        title: "Success",
        description: `All ${linksToDelete.length} ${categoryName} cleared`,
      });
    } catch (error) {
      console.error('[handleClearAllLinks] Error clearing links:', error);
      toast({
        title: "Error",
        description: `Failed to clear all ${categoryName}`,
        variant: "destructive",
      });
    }
  };

  const handleClearAllNotes = async () => {
    if (!confirm('Are you sure you want to delete all notes? This action cannot be undone.')) return;
    
    try {
      const deletePromises = notes.map(note => 
        fetch(getApiUrl(`/projects/${projectId}/boarding/notes/${note.id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      );
      
      await Promise.all(deletePromises);
      setNotes([]);
      toast({
        title: "Success",
        description: "All notes cleared",
      });
    } catch (error) {
      console.error('Error clearing notes:', error);
      toast({
        title: "Error",
        description: "Failed to clear all notes",
        variant: "destructive",
      });
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'notes': return 'sticky-note';
      case 'documents': return 'file-text';
      case 'links': return 'link';
      default: return 'square';
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'notes': return 'yellow';
      case 'documents': return 'blue';
      case 'links': return 'purple';
      default: return 'primary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
    <div className="h-full flex flex-col">
      {/* Premium Header */}
      <div className="mb-8 pb-6 border-b border-white/5 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Project Boarding</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Organize, collaborate, and inspire your team</p>
            </div>
          </div>
          <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary/20 hover:bg-primary/30 border border-primary/50">
                <Plus className="w-4 h-4 mr-2" /> New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Card</DialogTitle>
                <DialogDescription>
                  Add a custom card to your project boarding
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <Label htmlFor="card-name">Card Name *</Label>
                  <Input
                    id="card-name"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="e.g., Resources, Quick Links, Team Updates"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="card-type">Card Type *</Label>
                  <select
                    id="card-type"
                    value={newCardType}
                    onChange={(e) => setNewCardType(e.target.value as 'notes' | 'documents' | 'links' | 'custom')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="custom">Custom (General Purpose)</option>
                    <option value="notes">Notes (Text content)</option>
                    <option value="documents">Documents (Files & Images)</option>
                    <option value="links">Links (URLs & Resources)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {newCardType === 'notes' && 'For storing text notes and quick reminders'}
                    {newCardType === 'documents' && 'For uploading and managing files and images'}
                    {newCardType === 'links' && 'For organizing web links and resources'}
                    {newCardType === 'custom' && 'Flexible card for any type of content'}
                  </p>
                </div>
                <Button type="submit" className="w-full">Create Card</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Flexible Premium Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-auto pb-6">
        {/* Tasks - Premium Card */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Tasks</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">{tasks.length}</span>
                {tasks.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleClearAllTasks()}
                    title="Clear all tasks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-4">
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-11 bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 border border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold">
                    <Plus className="w-5 h-5 mr-2" /> Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Assign a task to a team member
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Task Title *</Label>
                      <Input
                        id="task-title"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Enter task title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Enter task description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="assign-to">Assign To *</Label>
                      <select
                        id="assign-to"
                        value={taskAssignedTo || ''}
                        onChange={(e) => setTaskAssignedTo(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-secondary/30 border border-white/5 rounded-md text-foreground"
                        required
                      >
                        <option value="">Select a member</option>
                        {projectMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full">Create Task</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[450px] overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                        <CheckSquare className="w-10 h-10 opacity-20" />
                      </div>
                      <p className="font-semibold text-foreground/70">No tasks yet</p>
                      <p className="text-xs mt-1.5">Create your first task to get started</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="group p-4 bg-gradient-to-br from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 rounded-xl border border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="font-bold text-base text-foreground flex-1 leading-tight">{task.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className={cn("px-3 py-1 rounded-lg text-[11px] font-bold border-2 shrink-0 shadow-sm", getStatusColor(task.status))}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {(isAdmin || task.created_by === user?.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary">{task.assigned_to_user?.name[0]}</span>
                            </div>
                            <span className="font-medium text-foreground/90">{task.assigned_to_user?.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskStatusChange(task.id, 'pending')}
                              className={cn("h-7 px-2 text-xs rounded-lg font-bold transition-all", task.status === 'pending' ? 'bg-gray-500/40 text-gray-200 shadow-inner' : 'hover:bg-gray-500/20')}
                              title="Pending"
                            >
                              ⏸
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                              className={cn("h-7 px-2 text-xs rounded-lg font-bold transition-all", task.status === 'in_progress' ? 'bg-blue-500/40 text-blue-200 shadow-inner' : 'hover:bg-blue-500/20')}
                              title="In Progress"
                            >
                              ▶
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskStatusChange(task.id, 'completed')}
                              className={cn("h-7 px-2 text-xs rounded-lg font-bold transition-all", task.status === 'completed' ? 'bg-green-500/40 text-green-200 shadow-inner' : 'hover:bg-green-500/20')}
                              title="Done"
                            >
                              ✓
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Documents - Premium Card */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-blue-500/10 to-secondary/20 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-foreground">Documents</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-blue-500/10 px-2 py-1 rounded-full">{documents.length}</span>
                {documents.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleClearAllDocuments()}
                    title="Clear all documents"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-4">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    className="w-full h-11 bg-gradient-to-r from-blue-500/30 to-blue-600/20 hover:from-blue-500/40 hover:to-blue-600/30 border border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" /> Upload Document
                  </Button>
                </label>
              </div>

              <ScrollArea className="h-[450px] overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-500/5 flex items-center justify-center">
                        <FileText className="w-10 h-10 opacity-20" />
                      </div>
                      <p className="font-semibold text-foreground/70">No documents yet</p>
                      <p className="text-xs mt-1.5">Upload files to share with your team</p>
                    </div>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className="group p-4 bg-gradient-to-br from-blue-500/10 to-secondary/10 hover:from-blue-500/20 hover:to-secondary/20 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg">
                        <div 
                          className="flex items-start gap-3 cursor-pointer mb-3"
                          onClick={() => {
                            console.log('Document clicked:', doc);
                            console.log('Description:', doc.description);
                            setSelectedDocument(doc);
                            setIsDocumentViewOpen(true);
                          }}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate mb-1">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">{doc.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1.5">
                              <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                              <span>•</span>
                              <span>{doc.uploader?.name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-blue-500/20">
                          <Button
                            size="sm"
                            className="h-9 flex-1 text-xs font-semibold bg-gradient-to-r from-blue-500/30 to-blue-600/20 hover:from-blue-500/40 hover:to-blue-600/30 border border-blue-500/50 text-white shadow-lg hover:shadow-xl transition-all"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents/${doc.id}/download`), {
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = doc.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                }
                              } catch (error) {
                                console.error('Download error:', error);
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>
                          {(isAdmin || doc.uploaded_by === user?.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Helper Resources - Premium Card */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-cyan-500/10 to-secondary/20 backdrop-blur-sm rounded-2xl border border-cyan-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-foreground">Helper Resources</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-cyan-500/10 px-2 py-1 rounded-full">{helperLinks.length}</span>
                {helperLinks.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleClearAllLinks('helper')}
                    title="Clear all helper links"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-4">
              <Dialog open={isLinkDialogOpen && linkType === 'helper'} onOpenChange={(open) => {
                setIsLinkDialogOpen(open);
                if (open) setLinkType('helper');
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full h-11 bg-gradient-to-r from-cyan-500/30 to-cyan-600/20 hover:from-cyan-500/40 hover:to-cyan-600/30 border border-cyan-500/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold">
                    <Paperclip className="w-5 h-5 mr-2" /> Add Helper Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Helper Link</DialogTitle>
                    <DialogDescription>
                      Add a helpful resource or tool link
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateLink} className="space-y-4">
                    <div>
                      <Label htmlFor="link-title">Title *</Label>
                      <Input
                        id="link-title"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="Enter link title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-url">URL *</Label>
                      <Input
                        id="link-url"
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-description">Description</Label>
                      <Textarea
                        id="link-description"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Enter description"
                        rows={2}
                      />
                    </div>
                    <Button type="submit" className="w-full">Add Link</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[350px] overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {helperLinks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/5 flex items-center justify-center">
                        <Paperclip className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-semibold text-foreground/70">No helper links</p>
                      <p className="text-xs mt-1.5">Add useful resources</p>
                    </div>
                  ) : (
                    helperLinks.map(link => (
                      <div key={link.id} className="group p-4 bg-gradient-to-br from-cyan-500/15 to-secondary/10 hover:from-cyan-500/25 hover:to-secondary/15 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                              <LinkIcon className="w-4 h-4 text-cyan-400" />
                            </div>
                            <h4 className="font-bold text-sm text-foreground truncate">{link.title}</h4>
                          </div>
                          {(isAdmin || link.created_by === user?.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              onClick={() => handleDeleteLink(link.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2 leading-relaxed">{link.description}</p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                        >
                          Open Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Inspiration - Premium Card */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-purple-500/10 to-secondary/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-foreground">Inspiration</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-purple-500/10 px-2 py-1 rounded-full">{inspirationLinks.length}</span>
                {inspirationLinks.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleClearAllLinks('inspiration')}
                    title="Clear all inspiration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-4">
              <Dialog open={isLinkDialogOpen && linkType === 'inspiration'} onOpenChange={(open) => {
                setIsLinkDialogOpen(open);
                if (open) setLinkType('inspiration');
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full h-11 bg-gradient-to-r from-purple-500/30 to-purple-600/20 hover:from-purple-500/40 hover:to-purple-600/30 border border-purple-500/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold">
                    <Lightbulb className="w-5 h-5 mr-2" /> Add Inspiration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Inspiration Link</DialogTitle>
                    <DialogDescription>
                      Add an inspiring design, idea, or reference
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateLink} className="space-y-4">
                    <div>
                      <Label htmlFor="insp-title">Title *</Label>
                      <Input
                        id="insp-title"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="Enter link title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="insp-url">URL *</Label>
                      <Input
                        id="insp-url"
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="insp-description">Description</Label>
                      <Textarea
                        id="insp-description"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Enter description"
                        rows={2}
                      />
                    </div>
                    <Button type="submit" className="w-full">Add Link</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[350px] overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {inspirationLinks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/5 flex items-center justify-center">
                        <Lightbulb className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-semibold text-foreground/70">No inspiration yet</p>
                      <p className="text-xs mt-1.5">Share creative ideas</p>
                    </div>
                  ) : (
                    inspirationLinks.map(link => (
                      <div key={link.id} className="group p-4 bg-gradient-to-br from-purple-500/15 to-secondary/10 hover:from-purple-500/25 hover:to-secondary/15 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                              <Lightbulb className="w-4 h-4 text-purple-400" />
                            </div>
                            <h4 className="font-bold text-sm text-foreground truncate">{link.title}</h4>
                          </div>
                          {(isAdmin || link.created_by === user?.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              onClick={() => handleDeleteLink(link.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2 leading-relaxed">{link.description}</p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all"
                        >
                          Open Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Notes - Premium Card */}
        <div className="flex flex-col lg:col-span-2 xl:col-span-1">
          <div className="bg-gradient-to-br from-yellow-500/10 to-secondary/20 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-foreground">Notes</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-yellow-500/10 px-2 py-1 rounded-full">{notes.length}</span>
                {notes.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleClearAllNotes()}
                    title="Clear all notes"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write a quick note..."
                  className="bg-secondary/30 border-yellow-500/30 min-h-[100px] focus:border-yellow-500/50"
                />
                <Button
                  onClick={handleCreateNote}
                  disabled={!noteContent.trim()}
                  className="w-full h-11 bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 hover:from-yellow-500/40 hover:to-yellow-600/30 border border-yellow-500/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Note
                </Button>
              </div>

              <ScrollArea className="h-[350px] overflow-y-auto">
                <div className="space-y-3 pr-4">
                  {notes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/5 flex items-center justify-center">
                        <StickyNote className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-semibold text-foreground/70">No notes yet</p>
                      <p className="text-xs mt-1.5">Add quick notes and reminders</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="group p-4 bg-gradient-to-br from-yellow-500/15 to-secondary/10 hover:from-yellow-500/25 hover:to-secondary/15 rounded-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-yellow-400">{note.creator?.name[0]}</span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{note.creator?.name}</span>
                          </div>
                          {(isAdmin || note.created_by === user?.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-3 pt-3 border-t border-yellow-500/20">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Custom Cards */}
        {customCards.map(card => (
          <div key={card.id} className="flex flex-col">
            <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">{card.name}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">{card.items?.length || 0}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={() => handleDeleteCard(card.id)}
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  {card.type === 'documents' ? (
                    <>
                      <input
                        type="file"
                        id={`card-file-${card.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadToCard(card.id, file);
                          }
                        }}
                      />
                      <Button
                        onClick={() => document.getElementById(`card-file-${card.id}`)?.click()}
                        className="w-full h-11 bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 border border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold"
                      >
                        <Upload className="w-5 h-5 mr-2" /> Upload File
                      </Button>
                    </>
                  ) : card.type === 'links' ? (
                    <>
                      <Input
                        value={newCustomItem}
                        onChange={(e) => setNewCustomItem(e.target.value)}
                        placeholder="Enter URL..."
                        type="url"
                        className="bg-secondary/30 border-primary/30 focus:border-primary/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateCustomItem(card.id);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleCreateCustomItem(card.id)}
                        disabled={!newCustomItem.trim()}
                        className="w-full h-11 bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 border border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold"
                      >
                        <Plus className="w-5 h-5 mr-2" /> Add Link
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={newCustomItem}
                        onChange={(e) => setNewCustomItem(e.target.value)}
                        placeholder={`Add item to ${card.name}...`}
                        className="bg-secondary/30 border-primary/30 focus:border-primary/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateCustomItem(card.id);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleCreateCustomItem(card.id)}
                        disabled={!newCustomItem.trim()}
                        className="w-full h-11 bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 border border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300 text-black font-semibold"
                      >
                        <Plus className="w-5 h-5 mr-2" /> Add Item
                      </Button>
                    </>
                  )}
                </div>

                <ScrollArea className="h-[350px] overflow-y-auto">
                  <div className="space-y-3 pr-4">
                    {(!card.items || card.items.length === 0) ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                          <Layers className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-semibold text-foreground/70">No items yet</p>
                        <p className="text-xs mt-1.5">Add your first item to this card</p>
                      </div>
                    ) : (
                      card.items.map(item => (
                        <div key={item.id} className="group p-4 bg-gradient-to-br from-primary/15 to-secondary/10 hover:from-primary/25 hover:to-secondary/15 rounded-xl border border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary">{item.creator?.name[0]}</span>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">{item.creator?.name}</span>
                            </div>
                            {(isAdmin || item.created_by === user?.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                                onClick={() => handleDeleteCustomItem(card.id, item.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Render content based on type */}
                          {item.file_path ? (
                            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-primary/20">
                              <FileText className="w-5 h-5 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.file_name || item.content}</p>
                                {item.file_size && (
                                  <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/storage/${item.file_path}`, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : card.type === 'links' ? (
                            <a 
                              href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {item.content}
                            </a>
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.content}</p>
                          )}
                          
                          <p className="text-[10px] text-muted-foreground/70 mt-3 pt-3 border-t border-primary/20">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a description for your document (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="p-3 bg-secondary/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <span className="text-sm font-medium block">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="document-description">Description</Label>
              <Textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter a description for this document..."
                rows={3}
                disabled={isUploading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDocumentDialogOpen(false);
                  setSelectedFile(null);
                  setDocumentDescription("");
                  setUploadProgress(0);
                  // Reset file input
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog open={isDocumentViewOpen} onOpenChange={setIsDocumentViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{selectedDocument.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedDocument.file_size)} • Uploaded by {selectedDocument.uploader?.name}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  {selectedDocument.description ? (
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{selectedDocument.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground italic">No description provided</p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-muted-foreground">
                    Uploaded on {new Date(selectedDocument.created_at).toLocaleDateString()} at {new Date(selectedDocument.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch(getApiUrl(`/projects/${projectId}/boarding/documents/${selectedDocument.id}/download`), {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = selectedDocument.name;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }
                    } catch (error) {
                      console.error('Download error:', error);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {(isAdmin || selectedDocument.uploaded_by === user?.id) && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteDocument(selectedDocument.id);
                      setIsDocumentViewOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
