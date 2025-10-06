-- Fix infinite recursion in RLS policies using security definer functions

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization members can view all team members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organization tasks" ON public.tasks;

-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.user_is_org_member(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND organization_members.user_id = user_id
  )
$$;

-- Recreate organizations policy without recursion
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR public.user_is_org_member(id, auth.uid())
);

-- Recreate organization_members policy for viewing own membership
CREATE POLICY "Users can view their own memberships" 
ON public.organization_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow viewing other members in the same organization
CREATE POLICY "Members can view team members" 
ON public.organization_members 
FOR SELECT 
USING (
  public.user_is_org_member(organization_id, auth.uid())
);

-- Fix tasks policy to use the security definer function
CREATE POLICY "Users can view organization tasks" 
ON public.tasks 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND public.user_is_org_member(organization_id, auth.uid())
);