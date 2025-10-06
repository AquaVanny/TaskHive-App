-- Fix infinite recursion in organization_members and organizations RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;

-- Recreate organization_members policy without recursion
CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Fix organizations policy - corrected the JOIN condition
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  (owner_id = auth.uid()) 
  OR 
  (EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
  ))
);

-- Add policy to allow organization members to view other members
CREATE POLICY "Organization members can view all team members" 
ON public.organization_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = auth.uid()
  )
);