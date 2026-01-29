import type { ArticleSection } from '@/types';
import { reassembleArticle, extractAllCitations } from './reassembler';

export function exportToMarkdown(
  title: string,
  sections: ArticleSection[],
  includeMetadata: boolean = false
): string {
  let markdown = `# ${title}\n\n`;

  if (includeMetadata) {
    const citations = extractAllCitations(sections);
    const verifiedDate = new Date().toISOString().split('T')[0];

    markdown += `> **Verified:** ${verifiedDate}\n`;
    markdown += `> **Citations:** ${citations.length}\n\n`;
    markdown += `---\n\n`;
  }

  markdown += reassembleArticle(sections);

  return markdown;
}

export function exportToMarkdownWithSourcesList(
  title: string,
  sections: ArticleSection[]
): string {
  let markdown = exportToMarkdown(title, sections, false);

  // Add sources list at the end
  const citations = extractAllCitations(sections);

  if (citations.length > 0) {
    markdown += '\n\n---\n\n## Sources\n\n';

    // Deduplicate by URL
    const uniqueCitations = Array.from(
      new Map(citations.map(c => [c.url, c])).values()
    );

    for (let i = 0; i < uniqueCitations.length; i++) {
      markdown += `${i + 1}. [${uniqueCitations[i].title}](${uniqueCitations[i].url})\n`;
    }
  }

  return markdown;
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
