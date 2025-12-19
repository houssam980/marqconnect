import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Users,
  CheckSquare,
  Briefcase,
  LogOut,
  MessageSquare,
  Folder,
  ChevronRight,
  ChevronDown,
  Layers,
  Settings,
  Bell,
  User,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  className?: string;
  activePage?: string;
  onNavigate?: (page: string) => void;
}

const navItems = [
  { icon: LayoutGrid, label: "Accueil", id: "home" },
  { 
    icon: Layers, 
    label: "Espace", 
    id: "espace",
    children: [
      { label: "Espace général", icon: Users, description: "All members & general chat", id: "general" },
      { label: "Espace projet", icon: Folder, description: "Project chat, docs & tasks", id: "project" }
    ]
  },
  { icon: CheckSquare, label: "New Assignment task", id: "client-tasks" },
  { icon: Users, label: "Equipe", id: "equip", adminOnly: true },
  { icon: Calendar, label: "Events", id: "events" },
];

export function Sidebar({ className, activePage = "home", onNavigate }: SidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const { user, logout } = useAuth();
  
  const userName = user?.name || "User";

  const toggleSection = (label: string) => {
    setOpenSections(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleNavigate = (id: string) => {
    if (onNavigate) onNavigate(id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[80px] bg-black/40 backdrop-blur-xl border-r border-white/5 py-6 items-center transition-all duration-300 z-50",
        className
      )}
    >
      <div className="mb-8">
        <div 
          className="w-12 h-12 flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => handleNavigate("home")}
        >
          <img 
            src="https://i.postimg.cc/cJxqztmS/logo-png-01.png" 
            alt="Nexus Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(225,247,0,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(225,247,0,0.8)] transition-all duration-300"
          />
        </div>
      </div>

      <div className="mb-6 w-full px-2 flex justify-center">
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold cursor-help">
                        {getInitials(userName)}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10 text-foreground">
                    <p>{userName}</p>
                </TooltipContent>
            </Tooltip>
         </TooltipProvider>
      </div>

      <div className="flex-1 flex flex-col gap-3 w-full px-3">
        <TooltipProvider delayDuration={0}>
          {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item, index) => {
            if (item.children) {
              const isOpen = openSections.includes(item.label);
              const isActive = item.children.some(child => child.id === activePage);
              
              return (
                <Collapsible
                  key={index}
                  open={isOpen}
                  onOpenChange={() => toggleSection(item.label)}
                  className="w-full flex flex-col items-center"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "w-full h-12 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            isActive 
                              ? "text-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(225,247,0,0.1)]" 
                              : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 transition-all duration-300 group-hover:scale-110",
                              isActive && "drop-shadow-[0_0_8px_rgba(225,247,0,0.5)]"
                            )}
                          />
                          <ChevronDown 
                            className={cn(
                              "absolute right-1 bottom-1 w-3 h-3 opacity-50 transition-transform duration-300",
                              isOpen && "rotate-180"
                            )} 
                          />
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#e1f700]" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10 text-foreground">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down w-full flex flex-col items-center gap-2 mt-2 mb-2">
                    {item.children.map((child, childIndex) => (
                      <Tooltip key={childIndex}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigate(child.id)}
                            className={cn(
                              "w-10 h-10 rounded-lg transition-all duration-300",
                              activePage === child.id 
                                ? "text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(225,247,0,0.1)]" 
                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                            )}
                          >
                            <child.icon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10 text-foreground">
                          <p className="font-medium">{child.label}</p>
                          <p className="text-xs text-muted-foreground">{child.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            const isActive = activePage === item.id;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => item.id && handleNavigate(item.id)}
                    className={cn(
                      "w-full h-12 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "text-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(225,247,0,0.1)]" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-all duration-300 group-hover:scale-110",
                        isActive && "drop-shadow-[0_0_8px_rgba(225,247,0,0.5)]"
                      )}
                    />
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#e1f700]" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10 text-foreground">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      <div className="mt-auto px-3 w-full flex flex-col gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate("settings")}
                className={cn(
                  "w-full h-12 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  activePage === "settings"
                    ? "text-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(225,247,0,0.1)]"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <Settings className={cn(
                  "w-5 h-5 transition-all duration-300 group-hover:rotate-90",
                  activePage === "settings" && "drop-shadow-[0_0_8px_rgba(225,247,0,0.5)]"
                )} />
                {activePage === "settings" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#e1f700]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card/90 backdrop-blur-xl border-white/10">
              <p>Déconnexion</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
