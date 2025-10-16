-- Fix task deletion policy - only task creator can delete

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Create a strict delete policy - only the task creator can delete
CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (
  -- Can only delete if you created it
  user_id = auth.uid()
);
