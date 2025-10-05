import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export const FloatingActionButton = ({
  onClick,
  className,
  label = 'Add',
}: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg md:bottom-6',
        'hover:shadow-xl transition-all',
        className
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">{label}</span>
    </Button>
  );
};
