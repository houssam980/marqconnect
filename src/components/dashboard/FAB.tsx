import React from "react";
import { Plus, FileText, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FAB() {
  return (
    <div className="fixed bottom-8 right-8 z-50 group">
      <div className="absolute bottom-full right-0 pb-4 flex flex-col gap-3 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
        {[
          { icon: FileText, label: "New Doc" },
          { icon: Calendar, label: "Schedule" },
          { icon: MessageSquare, label: "Chat" },
        ].map((item, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      <Button
        size="icon"
        className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(225,247,0,0.4)] hover:shadow-[0_0_30px_rgba(225,247,0,0.6)] hover:scale-105 transition-all duration-300"
      >
        <Plus className="w-8 h-8 transition-transform duration-300 group-hover:rotate-[135deg]" strokeWidth={2.5} />
      </Button>
    </div>
  );
}
