import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { reassembleArticle } from '@/lib/article/reassembler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { approved_sections } = body; // Array of section IDs to approve, or 'all'

    // Fetch the article with sections
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        sections:article_sections(*)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update section statuses
    if (approved_sections === 'all') {
      await supabase
        .from('article_sections')
        .update({ status: 'approved' })
        .eq('article_id', id);
    } else if (Array.isArray(approved_sections)) {
      for (const sectionId of approved_sections) {
        await supabase
          .from('article_sections')
          .update({ status: 'approved' })
          .eq('id', sectionId);
      }
    }

    // Fetch updated sections
    const { data: sections } = await supabase
      .from('article_sections')
      .select('*')
      .eq('article_id', id)
      .order('section_index', { ascending: true });

    // Reassemble the verified content
    const verifiedContent = reassembleArticle(sections || []);

    // Update article with verified content and status
    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update({
        verified_content: verifiedContent,
        status: 'approved',
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Error approving article:', error);
    return NextResponse.json({ error: 'Failed to approve article' }, { status: 500 });
  }
}
