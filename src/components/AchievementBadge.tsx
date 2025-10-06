import { Badge } from '@/components/ui/badge';
import { Award, Target, Zap, Trophy } from 'lucide-react';

interface AchievementBadgeProps {
  type: 'streak' | 'tasks' | 'habits' | 'team';
  count: number;
  label: string;
}

const icons = {
  streak: Zap,
  tasks: Target,
  habits: Award,
  team: Trophy,
};

export const AchievementBadge = ({ type, count, label }: AchievementBadgeProps) => {
  const Icon = icons[type];
  
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
};
