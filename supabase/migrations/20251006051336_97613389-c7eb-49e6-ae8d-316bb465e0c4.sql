-- Fix infinite recursion in organization_members RLS policies
-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(_organization_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- Create new policies using the security definer function
CREATE POLICY "Users can view members of their organizations"
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_organization_member(organization_id, auth.uid())
);

CREATE POLICY "Organization owners can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id
    AND owner_id = auth.uid()
  )
);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for tables
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.habits REPLICA IDENTITY FULL;
ALTER TABLE public.habit_completions REPLICA IDENTITY FULL;
ALTER TABLE public.organization_members REPLICA IDENTITY FULL;