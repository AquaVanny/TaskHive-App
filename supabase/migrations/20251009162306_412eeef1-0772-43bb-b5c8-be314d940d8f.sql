-- Allow users to view profiles of other members in their organizations
CREATE POLICY "Users can view team member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members om1
    INNER JOIN public.organization_members om2 
      ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = profiles.id
  )
);