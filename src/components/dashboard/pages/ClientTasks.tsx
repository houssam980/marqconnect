import React from "react";
import { TaskBoard } from "../widgets/TaskBoard";

export function ClientTasks() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-display font-bold text-foreground">Client Tasks</h2>
        <p className="text-muted-foreground">Manage external client deliverables and requests.</p>
      </div>
      <div className="flex-1 min-h-0">
        <TaskBoard />
      </div>
    </div>
  );
}
