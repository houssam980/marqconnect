import React, { useState, useEffect } from "react";
import { DashboardCard } from "../DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/config/api.config";

interface Event {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  color: string;
  created_by: string;
  created_at: string;
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // Form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState("bg-blue-500");

  const { token, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(getApiUrl("/events"), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventStartDate || !eventEndDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Convert datetime-local format to MySQL datetime format
    const formatDateForBackend = (dateString: string) => {
      if (!dateString) return null;
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Convert to: "YYYY-MM-DD HH:mm:00"
      return dateString.replace('T', ' ') + ':00';
    };

    try {
      const response = await fetch(getApiUrl("/events"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription || null,
          start_date: formatDateForBackend(eventStartDate),
          end_date: formatDateForBackend(eventEndDate),
          location: eventLocation || null,
          color: eventColor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(prev => [...prev, data.event]);
        closeDialog();
        toast({
          title: "Success",
          description: "Event created successfully",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Validation errors:", errorData);
        const errorMessage = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.message || "Failed to create event");
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !eventTitle.trim() || !eventStartDate || !eventEndDate) {
      return;
    }

    // Convert datetime-local format to MySQL datetime format
    const formatDateForBackend = (dateString: string) => {
      if (!dateString) return null;
      return dateString.replace('T', ' ') + ':00';
    };

    try {
      const response = await fetch(getApiUrl(`/events/${selectedEvent.id}`), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription || null,
          start_date: formatDateForBackend(eventStartDate),
          end_date: formatDateForBackend(eventEndDate),
          location: eventLocation || null,
          color: eventColor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(prev => prev.map(e => e.id === selectedEvent.id ? data.event : e));
        closeDialog();
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Validation errors:", errorData);
        const errorMessage = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.message || "Failed to update event");
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to update event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/events/${id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setEventStartDate(new Date(event.start_date).toISOString().slice(0, 16));
    setEventEndDate(new Date(event.end_date).toISOString().slice(0, 16));
    setEventLocation(event.location || "");
    setEventColor(event.color);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedEvent(null);
    setEventTitle("");
    setEventDescription("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLocation("");
    setEventColor("bg-blue-500");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-red-500", label: "Red" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-pink-500", label: "Pink" },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between z-10" style={{ zIndex: 10 }}>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Events
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage calendar events
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-16 w-16 rounded-full shadow-[0_0_20px_rgba(225,247,0,0.4)] hover:shadow-[0_0_30px_rgba(225,247,0,0.6)] hover:scale-105 transition-all duration-300"
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedEvent(null);
                }}
              >
                <Plus className="w-8 h-8 transition-transform duration-300" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-2 border-white/30 shadow-2xl z-[99999] !z-[99999]" style={{ zIndex: 99999 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {isEditMode ? "Edit Event" : "Create New Event"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Update event details" : "Add a new event to the calendar"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={isEditMode ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Title *</Label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event title"
                    className="bg-secondary/30 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-description">Description</Label>
                  <Input
                    id="event-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Event description"
                    className="bg-secondary/30 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-start">Start Date & Time *</Label>
                    <Input
                      id="event-start"
                      type="datetime-local"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="bg-secondary/30 border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-end">End Date & Time *</Label>
                    <Input
                      id="event-end"
                      type="datetime-local"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="bg-secondary/30 border-white/10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Event location"
                    className="bg-secondary/30 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-color">Color</Label>
                  <select
                    id="event-color"
                    value={eventColor}
                    onChange={(e) => setEventColor(e.target.value)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-primary/30 bg-secondary/30 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-primary/50 hover:bg-secondary/50 transition-all duration-300 text-foreground appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-card text-foreground py-2">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isEditMode ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No events scheduled</p>
            {isAdmin && <p className="text-sm mt-2">Click the + button to create an event</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <DashboardCard key={event.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-3 h-3 rounded-full", event.color)} />
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-500"
                        onClick={() => {
                          setEventToDelete(event.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Created by {event.created_by}
                  </div>
                </div>
              </DashboardCard>
            ))}
          </div>
        )}
      </div>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (eventToDelete) {
                  handleDeleteEvent(eventToDelete);
                  setEventToDelete(null);
                }
                setIsDeleteDialogOpen(false);
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

