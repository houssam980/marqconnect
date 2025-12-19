import React from "react";
import { DashboardCard } from "../DashboardCard";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, change, trend, icon, className }: StatsCardProps) {
  return (
    <DashboardCard className={cn("flex flex-col justify-between", className)}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-muted-foreground text-sm font-medium">{title}</span>
        {icon && <div className="text-primary p-2 bg-primary/10 rounded-lg">{icon}</div>}
      </div>
      
      <div>
        <h4 className="text-3xl font-display font-bold text-foreground mb-2 tracking-tight">{value}</h4>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" 
                ? "text-primary bg-primary/10" 
                : "text-destructive bg-destructive/10"
            )}
          >
            {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </div>
    </DashboardCard>
  );
}
