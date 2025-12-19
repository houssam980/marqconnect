import React from "react";
import { DashboardCard } from "../DashboardCard";

const projects = [
  { name: "Website Redesign", progress: 75, color: "#e1f700" },
  { name: "Mobile App", progress: 45, color: "#3b82f6" },
  { name: "Marketing Campaign", progress: 90, color: "#10b981" },
];

export function ProjectStatus() {
  return (
    <DashboardCard title="Project Status" className="h-full">
      <div className="space-y-6 mt-2">
        {projects.map((project, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{project.name}</span>
              <span className="font-mono text-muted-foreground">{project.progress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${project.progress}%`,
                  backgroundColor: project.color,
                  boxShadow: `0 0 10px ${project.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
