-- Fix organization_members policies for member insertion
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- Create separate policies for different operations
CREATE POLICY "Organization owners and members can insert themselves" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Organization owners can update members" 
ON public.organization_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can delete members" 
ON public.organization_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
  )
);