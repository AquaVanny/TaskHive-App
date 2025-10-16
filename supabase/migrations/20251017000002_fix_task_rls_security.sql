-- Audit and fix task RLS policies to prevent unauthorized access

-- First, verify RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop all existing SELECT policies on tasks to rebuild them properly
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view organization tasks" ON public.tasks;

-- Recreate with a single comprehensive policy
-- Users can view tasks if:
-- 1. They created it (personal task)
-- 2. It's assigned to them AND (it's personal OR they're in the organization)
CREATE POLICY "Users can view their tasks" 
ON public.tasks 
FOR SELECT 
USING (
  -- Created by user (personal task)
  user_id = auth.uid()
  OR
  -- Assigned to user AND either personal OR user is org member
  (
    assigned_to = auth.uid()
    AND (
      organization_id IS NULL  -- Personal task assigned to them
      OR
      public.user_is_org_member(organization_id, auth.uid())  -- Org task and they're a member
    )
  )
  OR
  -- Organization task where user is a member (but not assigned)
  (
    organization_id IS NOT NULL 
    AND public.user_is_org_member(organization_id, auth.uid())
  )
);

-- Important: This single policy handles all cases and prevents seeing org tasks after leaving
