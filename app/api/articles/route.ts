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
      .from('articles')
      .select(`
        *,
        client:clients(id, name),
        skill:skills(id, name)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    // Filter by client_id if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: articles, error } = await query;

    if (error) throw error;

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
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
    const { title, original_content, client_id, skill_id } = body;

    if (!title || !original_content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'User not in any organization' }, { status: 400 });
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        org_id: userOrg.org_id,
        title,
        original_content,
        client_id: client_id || null,
        skill_id: skill_id || null,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
