-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  category TEXT,
  reminder_time TIME,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_completions table
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can view organization tasks"
  ON public.tasks FOR SELECT
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = tasks.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (user_id = auth.uid());

-- Habits policies
CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (user_id = auth.uid());

-- Habit completions policies
CREATE POLICY "Users can view their own habit completions"
  ON public.habit_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own habit completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own habit completions"
  ON public.habit_completions FOR DELETE
  USING (user_id = auth.uid());

-- Task comments policies
CREATE POLICY "Users can view comments on accessible tasks"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can create comments on accessible tasks"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.task_comments FOR DELETE
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);