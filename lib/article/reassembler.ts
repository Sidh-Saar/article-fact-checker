import type { ArticleSection } from '@/types';

export function reassembleArticle(sections: ArticleSection[]): string {
  // Sort sections by index
  const sortedSections = [...sections].sort((a, b) => a.section_index - b.section_index);

  return sortedSections
    .map(section => {
      const content = section.verified_content || section.original_content;

      if (section.heading) {
        return `## ${section.heading}\n\n${content}`;
      }
      return content;
    })
    .join('\n\n');
}

export function generateMarkdownWithCitations(sections: ArticleSection[]): string {
  // The content already has inline citations from the fact-checker
  // Just reassemble the article
  return reassembleArticle(sections);
}

export function countTotalChanges(sections: ArticleSection[]): {
  total: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {
    citation_added: 0,
    link_removed: 0,
    language_softened: 0,
    claim_removed: 0,
    fact_corrected: 0,
  };

  let total = 0;

  for (const section of sections) {
    for (const change of section.changes) {
      byType[change.type] = (byType[change.type] || 0) + 1;
      total++;
    }
  }

  return { total, byType };
}

export function countTotalCitations(sections: ArticleSection[]): number {
  return sections.reduce((sum, section) => sum + section.citations.length, 0);
}

export function extractAllCitations(sections: ArticleSection[]): Array<{
  title: string;
  url: string;
  sectionIndex: number;
}> {
  const citations: Array<{ title: string; url: string; sectionIndex: number }> = [];

  for (const section of sections) {
    for (const citation of section.citations) {
      citations.push({
        title: citation.title,
        url: citation.url,
        sectionIndex: section.section_index,
      });
    }
  }

  return citations;
}
