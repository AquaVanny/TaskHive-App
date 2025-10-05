import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export const FilterBar = ({ options, activeFilter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className={cn(
            'transition-all',
            activeFilter === option.value && 'shadow-sm'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
