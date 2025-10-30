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
      
      <main 
        className="flex-1 w-full"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '4rem',
          minHeight: '100vh'
        }}
      >
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>
      
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border md:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <BottomNavigation />
      </div>
    </div>
  );
};
