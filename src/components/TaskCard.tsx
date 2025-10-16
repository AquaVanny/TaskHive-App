import { CheckCircle2, Circle, Clock, Trash2, Edit, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, currentStatus: string) => void;
  onEdit?: (task: Task) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusColors = {
  pending: 'text-muted-foreground',
  in_progress: 'text-blue-500',
  completed: 'text-emerald-500',
};

export const TaskCard = ({ task, onToggle, onEdit, onDelete, currentUserId }: TaskCardProps) => {
  const isCompleted = task.status === 'completed';
  const canModify = currentUserId && task.user_id === currentUserId;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggle(task.id, task.status || 'pending')}
            className={cn(
              'h-8 w-8 p-0 transition-all hover:scale-110',
              isCompleted && 'text-emerald-500 hover:text-emerald-600'
            )}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6 hover:text-emerald-500" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-medium text-sm',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.priority && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', priorityColors[task.priority as keyof typeof priorityColors])}
                >
                  {task.priority}
                </Badge>
              )}

              {task.category && (
                <Badge variant="secondary" className="text-xs">
                  {task.category}
                </Badge>
              )}

              {task.assigned_to && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assigned
                </Badge>
              )}

              {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>

          {canModify && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(task)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
