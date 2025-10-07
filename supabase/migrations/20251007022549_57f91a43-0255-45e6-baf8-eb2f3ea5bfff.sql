
-- Fix notifications RLS policies to allow authenticated users to create notifications
DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;

CREATE POLICY "Authenticated users can create notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Service role can create notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add DELETE policy for notifications so users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix organizations with empty invite codes
UPDATE organizations 
SET invite_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE invite_code IS NULL OR invite_code = '';

-- Ensure all organization creators are members
INSERT INTO organization_members (organization_id, user_id, role)
SELECT o.id, o.owner_id, 'owner'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.organization_id = o.id 
  AND om.user_id = o.owner_id
)
ON CONFLICT DO NOTHING;
