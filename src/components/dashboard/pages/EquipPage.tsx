import React, { useState, useEffect } from "react";
import { DashboardCard } from "../DashboardCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, Activity, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/config/api.config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityLog {
  id: number;
  login_time: string;
  logout_time: string | null;
  last_heartbeat: string;
  duration_minutes: number;
  time_range: string;
  is_active: boolean;
  device_info: string;
  date: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  current_session: {
    login_time: string;
    duration_minutes: number;
    device_info: string;
  } | null;
  recent_activity: ActivityLog[];
}

export function EquipPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const itemsPerPage = 8;

  // Fetch users activity
  useEffect(() => {
    fetchUsersActivity();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsersActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsersActivity = async () => {
    try {
      const response = await apiRequest('/api/users/activity');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch users activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleViewActivity = (member: TeamMember) => {
    setSelectedMember(member);
    setShowActivityDialog(true);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Team Members</h2>
          <p className="text-muted-foreground">Monitor team activity and status.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search team..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/30 border-white/5"
            />
          </div>
          <Button variant="outline" className="border-white/10">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <DashboardCard title="Team Directory" className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading team activity...</div>
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">No team members found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Session</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMembers.map((member) => (
                  <TableRow key={member.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`border-0 ${
                          member.is_online 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          member.is_online ? 'bg-green-500' : 'bg-zinc-500'
                        }`} />
                        {member.is_online ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {member.current_session ? (
                        <div>
                          <div>{formatDate(member.current_session.login_time)} - Now</div>
                          <div className="text-[10px] text-primary">
                            {formatDuration(member.current_session.duration_minutes)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500">Not active</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {member.current_session?.device_info || '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewActivity(member)}
                        className="text-xs"
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Activity History Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activity History - {selectedMember?.name}
            </DialogTitle>
            <DialogDescription>
              Complete activity log showing device on/off times and session durations
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {selectedMember?.recent_activity && selectedMember.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {selectedMember.recent_activity.map((activity) => (
                  <div 
                    key={activity.id}
                    className={`p-4 rounded-lg border ${
                      activity.is_active 
                        ? 'border-green-500/20 bg-green-500/5' 
                        : 'border-white/10 bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`border-0 ${
                              activity.is_active 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-zinc-500/10 text-zinc-500'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              activity.is_active ? 'bg-green-500' : 'bg-zinc-500'
                            }`} />
                            {activity.is_active ? 'Currently Active' : 'Ended'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Device Turned On</div>
                            <div className="font-mono text-foreground">
                              {formatDate(activity.login_time)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Device Turned Off</div>
                            <div className="font-mono text-foreground">
                              {activity.logout_time 
                                ? formatDate(activity.logout_time) 
                                : activity.is_active 
                                  ? 'Still Online' 
                                  : formatDate(activity.last_heartbeat)
                              }
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Time Range: </span>
                            <span className="font-mono text-foreground">{activity.time_range}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration: </span>
                            <span className="font-mono text-primary font-medium">
                              {formatDuration(activity.duration_minutes)}
                            </span>
                          </div>
                          {activity.device_info && (
                            <div>
                              <span className="text-muted-foreground">Device: </span>
                              <span className="text-foreground">{activity.device_info}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No activity recorded yet</p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Total sessions: {selectedMember?.recent_activity.length || 0}
            </div>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
