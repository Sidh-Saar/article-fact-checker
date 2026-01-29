import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { divideArticle } from '@/lib/article/divider';
import { factCheckAllSections } from '@/lib/ai/fact-checker';
import { FACT_CHECK_PROMPTS } from '@/lib/ai/fact-checker';
import type { ArticleSection } from '@/types';

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

    // Fetch the article with client info
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('articles')
      .update({ status: 'processing' })
      .eq('id', id);

    // Divide article into sections
    const { sections } = divideArticle(article.original_content);

    // Create section records in database
    const sectionInserts = sections.map((section, index) => ({
      article_id: id,
      section_index: index,
      heading: section.heading,
      original_content: section.content,
      status: 'pending',
      citations: [],
      changes: [],
    }));

    const { data: dbSections, error: sectionsError } = await supabase
      .from('article_sections')
      .insert(sectionInserts)
      .select();

    if (sectionsError) throw sectionsError;

    // Get fact-check prompt (client-specific or default)
    let factCheckPrompt = FACT_CHECK_PROMPTS.general;
    if (article.client) {
      if (article.client.fact_check_prompt) {
        factCheckPrompt = article.client.fact_check_prompt;
      } else if (article.client.compliance_type && article.client.compliance_type !== 'none') {
        const complianceType = article.client.compliance_type.toLowerCase() as keyof typeof FACT_CHECK_PROMPTS;
        factCheckPrompt = FACT_CHECK_PROMPTS[complianceType] || FACT_CHECK_PROMPTS.general;
      }

      // Append compliance guidelines if present
      if (article.client.compliance_guidelines) {
        factCheckPrompt += `\n\nADDITIONAL GUIDELINES:\n${article.client.compliance_guidelines}`;
      }

      // Append allowed domains if present
      if (article.client.allowed_domains && article.client.allowed_domains.length > 0) {
        factCheckPrompt += `\n\nPREFERRED SOURCES (prioritize these domains):\n${article.client.allowed_domains.join('\n')}`;
      }
    }

    // Fact-check all sections in parallel
    const results = await factCheckAllSections(
      dbSections as ArticleSection[],
      factCheckPrompt
    );

    // Update sections with results
    for (const [sectionId, result] of results) {
      await supabase
        .from('article_sections')
        .update({
          verified_content: result.verified_content,
          citations: result.citations,
          changes: result.changes,
          status: 'verified',
        })
        .eq('id', sectionId);
    }

    // Update article status
    await supabase
      .from('articles')
      .update({ status: 'verified' })
      .eq('id', id);

    // Fetch updated article with sections
    const { data: updatedArticle } = await supabase
      .from('articles')
      .select(`
        *,
        sections:article_sections(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Error verifying article:', error);

    // Update status back to draft on error
    const supabase = await createClient();
    const { id } = await params;
    await supabase
      .from('articles')
      .update({ status: 'draft' })
      .eq('id', id);

    return NextResponse.json({ error: 'Failed to verify article' }, { status: 500 });
  }
}
