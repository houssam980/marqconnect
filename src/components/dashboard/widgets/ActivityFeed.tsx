import React from "react";
import { DashboardCard } from "../DashboardCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Activity data will be loaded from API in future updates
const activities: any[] = [];

export function ActivityFeed() {
  return (
    <DashboardCard title="Live Activity" className="h-full">
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here as your team works</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-start gap-4 group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarImage src={activity.avatar} />
                <AvatarFallback>{activity.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-foreground/90 leading-none">
                  <span className="font-medium text-foreground">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="text-primary font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground font-mono">{activity.time}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#e1f700]" />
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}
