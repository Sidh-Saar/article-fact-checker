import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        *,
        client:clients(id, name),
        skill:skills(id, name)
      `)
      .eq('client_id', clientId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching client articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
