import { X, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-border bg-background transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h2 className="text-lg font-bold text-primary">TaskHive</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleNavigation("/analytics")}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Analytics & Reports
          </Button>
          
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleNavigation("/settings")}
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleNavigation("/help")}
          >
            <HelpCircle className="mr-2 h-5 w-5" />
            Help & Support
          </Button>

          <Separator className="my-2" />

          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive"
            onClick={() => handleNavigation("/login")}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </nav>
      </aside>
    </>
  );
};
