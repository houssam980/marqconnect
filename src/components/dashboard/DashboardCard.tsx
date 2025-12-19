import React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function DashboardCard({ children, className, title, action, ...props }: DashboardCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-card/20 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        {(title || action) && (
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h3 className="font-display font-semibold text-lg tracking-tight text-foreground/90">
                {title}
              </h3>
            )}
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
