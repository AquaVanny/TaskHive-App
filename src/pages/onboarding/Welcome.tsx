import { useNavigate } from 'react-router-dom';
import { CheckSquare, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-bold text-primary">Welcome to TaskHive</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Your intelligent productivity companion
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold">Manage Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Organize and track your work efficiently
            </p>
          </div>

          <div className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Target className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-semibold">Build Habits</h3>
            <p className="text-sm text-muted-foreground">
              Track and maintain consistency
            </p>
          </div>

          <div className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <Users className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h3 className="font-semibold">Collaborate</h3>
            <p className="text-sm text-muted-foreground">
              Work together with your team
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <span className="ml-2">Step 1 of 3</span>
          </div>

          <Button size="lg" onClick={() => navigate('/onboarding/profile')}>
            Get Started
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
