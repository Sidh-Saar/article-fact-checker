-- Add client_id to skills table
-- This allows skills to be scoped to specific clients
-- A NULL client_id means the skill is org-wide (legacy behavior)

-- Add the client_id column
ALTER TABLE skills ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create index for client lookups
CREATE INDEX IF NOT EXISTS idx_skills_client_id ON skills(client_id);

-- Update RLS policies to include client-scoped access
-- Users can view skills in their org that are either org-wide (client_id IS NULL) or for a specific client
DROP POLICY IF EXISTS "Users can view skills in their org" ON skills;
CREATE POLICY "Users can view skills in their org"
  ON skills FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Users can create skills in their org
DROP POLICY IF EXISTS "Users can create skills in their org" ON skills;
CREATE POLICY "Users can create skills in their org"
  ON skills FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Users can update skills in their org
DROP POLICY IF EXISTS "Users can update skills in their org" ON skills;
CREATE POLICY "Users can update skills in their org"
  ON skills FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Users can delete skills in their org
DROP POLICY IF EXISTS "Users can delete skills in their org" ON skills;
CREATE POLICY "Users can delete skills in their org"
  ON skills FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));
