import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  ChevronRight,
  CalendarDays,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api.config';
import { cn } from '@/lib/utils';

interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  type?: string;
}

export default function MobileEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { token, user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(getApiUrl('/events'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate || isCreating) return;
    
    setIsCreating(true);
    try {
      // Format date for backend (YYYY-MM-DD HH:MM:SS)
      const formatDateForBackend = (dateString: string) => {
        if (!dateString) return '';
        return dateString.replace('T', ' ') + ':00';
      };

      const response = await fetch(getApiUrl('/events'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDescription || null,
          start_date: formatDateForBackend(newEventDate),
          end_date: formatDateForBackend(newEventDate), // Same as start for single-day events
          location: newEventLocation || null,
          color: '#3b82f6', // Default blue color
        }),
      });

      if (response.ok) {
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventDate('');
        setNewEventLocation('');
        setShowAddSheet(false);
        fetchEvents();
        toast({ title: 'Event created successfully' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create event:', errorData);
        toast({ title: 'Failed to create event', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({ title: 'Failed to create event', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const now = new Date();
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.start_date);
    if (filter === 'upcoming') return eventDate >= now;
    if (filter === 'past') return eventDate < now;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Events</h2>
            <p className="text-sm text-muted-foreground">{filteredEvents.length} events</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-1">
          {['upcoming', 'past', 'all'].map((status) => (
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
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No events found</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="mobile-card p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex gap-4">
                  {/* Date Box */}
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0',
                    isToday(event.start_date) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/50 text-muted-foreground'
                  )}>
                    <span className="text-xs font-medium">
                      {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold">
                      {new Date(event.start_date).getDate()}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                      {isToday(event.start_date) && (
                        <Badge className="bg-primary/20 text-primary text-[10px] px-2">
                          Today
                        </Badge>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.start_date)}
                      </span>
                      
                      {event.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {user?.role === 'admin' && (
        <button className="fab" onClick={() => setShowAddSheet(true)}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Event Sheet */}
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
                <h2 className="text-lg font-semibold text-white">Create Event</h2>
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
                  <label className="text-sm text-white/70 mb-1 block">Event Title</label>
                  <Input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Enter event title..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Location</label>
                  <Input
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Enter location..."
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-1 block">Description</label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 min-h-[50px] resize-none"
                  />
                </div>
              </div>

              {/* Fixed Button at Bottom */}
              <div className="p-4 mt-2">
                <button
                  onClick={handleAddEvent}
                  disabled={!newEventTitle.trim() || !newEventDate || isCreating}
                  className="w-full py-3.5 bg-[#E1F700] text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
