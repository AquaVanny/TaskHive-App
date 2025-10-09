-- Fix 1: Ensure profiles are created for all existing users without profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Fix 2: Update the handle_new_user trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix 3: Update notification RLS policies to allow task service to create notifications
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Allow authenticated users to create notifications for any user (needed for task assignments)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 4: Add index on profiles email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Fix 5: Add index on organization_members for faster member lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);