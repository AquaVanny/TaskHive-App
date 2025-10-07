import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <h1 className="text-lg font-bold text-primary md:hidden">TaskHive</h1>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};
