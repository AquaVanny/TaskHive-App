-- Add foreign key relationship for user_id in task_reminders table
ALTER TABLE public.task_reminders
ADD CONSTRAINT task_reminders_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;