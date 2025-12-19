import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "";

  return (
    <header className="flex items-center justify-between h-20 px-8 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search command..."
            className="pl-10 bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-secondary transition-all duration-300 rounded-xl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell onNavigate={onNavigate} />
        
        <div className="flex items-center gap-3 pl-6 border-l border-border/40">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {displayEmail && <p className="text-xs text-muted-foreground mt-1">{displayEmail}</p>}
          </div>
          <Avatar className="h-10 w-10 border-2 border-border hover:border-primary transition-colors cursor-pointer">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
