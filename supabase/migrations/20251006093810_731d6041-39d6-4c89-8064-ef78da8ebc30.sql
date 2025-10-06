-- Add 'owner' role to organization_members if not exists
-- First check what roles exist in the role column
DO $$ 
BEGIN
    -- Add owner as a valid value if it doesn't exist
    -- We'll just update the column to TEXT with CHECK constraint to include owner
    ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
    
    ALTER TABLE organization_members 
    ADD CONSTRAINT organization_members_role_check 
    CHECK (role IN ('owner', 'admin', 'member'));
END $$;