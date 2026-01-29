// Organization types
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface UserOrganization {
  user_id: string;
  org_id: string;
  role: 'admin' | 'member';
}

// Client types
export type ComplianceType = 'FINRA' | 'SEC' | 'HIPAA' | 'none';

export interface Client {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  compliance_type: ComplianceType | null;
  compliance_guidelines: string | null;
  fact_check_prompt: string | null;
  allowed_domains: string[];
  created_at: string;
}

// Skill types
export interface SkillVariable {
  name: string;
  description: string;
  required: boolean;
}

export interface Skill {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  prompt_text: string;
  variables: SkillVariable[];
  original_file: Record<string, unknown> | null;
  category: string | null;
  created_at: string;
}

// Article types
export type ArticleStatus = 'draft' | 'processing' | 'verified' | 'approved';

export interface Article {
  id: string;
  org_id: string;
  client_id: string | null;
  skill_id: string | null;
  title: string;
  original_content: string;
  verified_content: string | null;
  status: ArticleStatus;
  created_by: string;
  created_at: string;
}

// Article Section types
export type SectionStatus = 'pending' | 'processing' | 'verified' | 'approved' | 'rejected';

export interface Citation {
  title: string;
  url: string;
  position: number;
}

export interface Change {
  type: 'citation_added' | 'link_removed' | 'language_softened' | 'claim_removed' | 'fact_corrected';
  original: string;
  modified: string;
  reason: string;
}

export interface ArticleSection {
  id: string;
  article_id: string;
  section_index: number;
  heading: string | null;
  original_content: string;
  verified_content: string | null;
  status: SectionStatus;
  citations: Citation[];
  changes: Change[];
  created_at: string;
}

// Claude Code Skill file format
export interface ClaudeCodeSkillFile {
  name?: string;
  description?: string;
  prompt?: string;
  steps?: Array<{
    tool: string;
    prompt?: string;
    content?: string;
  }>;
  allowed_tools?: string[];
  model?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Fact-check result types
export interface FactCheckResult {
  verified_content: string;
  citations: Citation[];
  changes: Change[];
  confidence: number;
}

// Article with relations
export interface ArticleWithRelations extends Article {
  client?: Client;
  skill?: Skill;
  sections?: ArticleSection[];
}
