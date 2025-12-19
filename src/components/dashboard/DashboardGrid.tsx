import React from "react";
import { Header } from "./Header";
import { TaskBoard } from "./widgets/TaskBoard";
import { GeneralSpace } from "./pages/GeneralSpace";
import { ProjectSpace } from "./pages/ProjectSpace";
import { ClientTasks } from "./pages/ClientTasks";
import { EquipPage } from "./pages/EquipPage";
import { EquipePage } from "./pages/EquipePage";
import { SettingsPage } from "./pages/SettingsPage";
import { EventsPage } from "./pages/EventsPage";

interface DashboardGridProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export function DashboardGrid({ activePage = "home", onNavigate }: DashboardGridProps) {
  const renderContent = () => {
    switch (activePage) {
      case "home":
        return <TaskBoard />;
      case "general":
        return <GeneralSpace />;
      case "project":
        return <ProjectSpace />;
      case "client-tasks":
        return <ClientTasks />;
      case "equip":
        return <EquipePage />;
      case "events":
        return <EventsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <TaskBoard />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-background to-background/90 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header onNavigate={onNavigate} />
      
      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full w-full max-w-[1600px] mx-auto animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
