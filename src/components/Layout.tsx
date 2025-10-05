import { Outlet } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  );
};
