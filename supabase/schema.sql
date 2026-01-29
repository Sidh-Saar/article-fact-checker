-- SEO Article Fact-Checker Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (for SaaS multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users belong to organizations
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  PRIMARY KEY (user_id, org_id)
);

-- Clients with compliance requirements and custom prompts
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  compliance_type VARCHAR(50) DEFAULT 'none',
  compliance_guidelines TEXT,
  fact_check_prompt TEXT,
  allowed_domains JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claude Code Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  original_file JSONB,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  original_content TEXT NOT NULL,
  verified_content TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Sections (for parallel processing)
CREATE TABLE IF NOT EXISTS article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  heading VARCHAR(500),
  original_content TEXT NOT NULL,
  verified_content TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  citations JSONB DEFAULT '[]',
  changes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_skills_org_id ON skills(org_id);
CREATE INDEX IF NOT EXISTS idx_articles_org_id ON articles(org_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_client_id ON articles(client_id);
CREATE INDEX IF NOT EXISTS idx_articles_skill_id ON articles(skill_id);
CREATE INDEX IF NOT EXISTS idx_article_sections_article_id ON article_sections(article_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can see orgs they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- User Organizations: Users can see their own memberships
CREATE POLICY "Users can view their memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create memberships"
  ON user_organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Clients: Users can CRUD clients in their org
CREATE POLICY "Users can view clients in their org"
  ON clients FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create clients in their org"
  ON clients FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update clients in their org"
  ON clients FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete clients in their org"
  ON clients FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Skills: Users can CRUD skills in their org
CREATE POLICY "Users can view skills in their org"
  ON skills FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create skills in their org"
  ON skills FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update skills in their org"
  ON skills FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete skills in their org"
  ON skills FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Articles: Users can CRUD their own articles
CREATE POLICY "Users can view their articles"
  ON articles FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create articles"
  ON articles FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their articles"
  ON articles FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their articles"
  ON articles FOR DELETE
  USING (created_by = auth.uid());

-- Article Sections: Follow article permissions
CREATE POLICY "Users can view sections of their articles"
  ON article_sections FOR SELECT
  USING (article_id IN (
    SELECT id FROM articles WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can create sections for their articles"
  ON article_sections FOR INSERT
  WITH CHECK (article_id IN (
    SELECT id FROM articles WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can update sections of their articles"
  ON article_sections FOR UPDATE
  USING (article_id IN (
    SELECT id FROM articles WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can delete sections of their articles"
  ON article_sections FOR DELETE
  USING (article_id IN (
    SELECT id FROM articles WHERE created_by = auth.uid()
  ));
