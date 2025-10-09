-- Fix notifications RLS policy to allow creating notifications for any user
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a new INSERT policy that allows authenticated users to create notifications for any user
CREATE POLICY "Authenticated users can create notifications for anyone"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);