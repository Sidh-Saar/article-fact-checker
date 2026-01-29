import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/openrouter';
import { fillPromptVariables } from '@/lib/skills/parser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skill_id, variables, title, client_id } = body;

    if (!skill_id) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    // Fetch the skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skill_id)
      .single();

    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Fill in variables
    const filledPrompt = fillPromptVariables(skill.prompt_text, variables || {});

    // Generate article with Claude
    const systemPrompt = `You are an expert SEO content writer. Generate high-quality, well-structured articles in markdown format.
Use proper heading hierarchy (H2 for main sections, H3 for subsections).
Include an engaging introduction and conclusion.
Write in a professional yet accessible tone.
Aim for comprehensive coverage of the topic.`;

    const content = await generateWithClaude(systemPrompt, filledPrompt);

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'User not in any organization' }, { status: 400 });
    }

    // Create the article
    const articleTitle = title || `Generated Article - ${new Date().toLocaleDateString()}`;

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        org_id: userOrg.org_id,
        title: articleTitle,
        original_content: content,
        skill_id: skill_id,
        client_id: client_id || null,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (articleError) throw articleError;

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}
