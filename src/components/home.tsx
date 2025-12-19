import React, { useState, useEffect } from "react";
import { Sidebar } from "./dashboard/Sidebar";
import { DashboardGrid } from "./dashboard/DashboardGrid";
import { activityTracker } from "../services/activityTracker";

function Home() {
  const [activePage, setActivePage] = useState("home");

  // Initialize activity tracking
  useEffect(() => {
    activityTracker.start();

    return () => {
      activityTracker.stop();
    };
  }, []);

  return (
    <div className="w-screen h-screen flex bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <DashboardGrid activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}

export default Home;

