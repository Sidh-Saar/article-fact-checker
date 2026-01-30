import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('skills')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by client_id if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: skills, error } = await query;

    if (error) throw error;

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, prompt_text, variables, original_file, category } = body;

    if (!name || !prompt_text) {
      return NextResponse.json({ error: 'Name and prompt_text are required' }, { status: 400 });
    }

    // Get or create user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    let orgId = userOrg?.org_id;

    if (!orgId) {
      // Create default organization for user
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
        client_id: body.client_id || null,
        name,
        description,
        prompt_text,
        variables: variables || [],
        original_file,
        category,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
