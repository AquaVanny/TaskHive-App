-- Create table to track scheduled task reminders
CREATE TABLE IF NOT EXISTS public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders"
ON public.task_reminders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reminders"
ON public.task_reminders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
ON public.task_reminders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
ON public.task_reminders
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_task_reminders_scheduled 
ON public.task_reminders(reminder_scheduled_at, reminder_sent) 
WHERE reminder_sent = FALSE;

-- Create trigger for updated_at
CREATE TRIGGER update_task_reminders_updated_at
BEFORE UPDATE ON public.task_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();