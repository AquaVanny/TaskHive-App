-- Allow organization members to delete their own membership (leave organization)
CREATE POLICY "Users can leave organizations (delete their own membership)" 
ON public.organization_members 
FOR DELETE 
USING (user_id = auth.uid());
