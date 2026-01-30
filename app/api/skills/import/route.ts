import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseSkillFile } from '@/lib/skills/parser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string | null;
    const clientId = formData.get('clientId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const parsed = parseSkillFile(content);

    // Get or create user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    let orgId = userOrg?.org_id;

    if (!orgId) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: `${user.email}'s Organization` })
        .select()
        .single();

      if (orgError) throw orgError;

      await supabase
        .from('user_organizations')
        .insert({ user_id: user.id, org_id: newOrg.id, role: 'admin' });

      orgId = newOrg.id;
    }

    const { data: skill, error } = await supabase
      .from('skills')
      .insert({
        org_id: orgId,
        client_id: clientId || null,
        name: parsed.name,
        description: parsed.description,
        prompt_text: parsed.promptText,
        variables: parsed.variables,
        original_file: parsed.originalFile,
        category: category || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      skill,
      parsed: {
        name: parsed.name,
        description: parsed.description,
        variablesFound: parsed.variables.length,
      },
    });
  } catch (error) {
    console.error('Error importing skill:', error);
    return NextResponse.json({ error: 'Failed to import skill' }, { status: 500 });
  }
}
