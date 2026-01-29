import pLimit from 'p-limit';
import { factCheckWithGPT } from './openrouter';
import type { ArticleSection, Citation, Change, FactCheckResult } from '@/types';

// Limit concurrent API calls to 4
const limit = pLimit(4);

interface ParsedFactCheckResponse {
  verifiedContent: string;
  changes: Change[];
}

function parseFactCheckResponse(response: string): ParsedFactCheckResponse {
  const changes: Change[] = [];
  let verifiedContent = response;

  // Extract changes section if present
  const changesMatch = response.match(/---CHANGES---([\s\S]*?)---END CHANGES---/g);

  if (changesMatch) {
    // Remove changes section from content
    verifiedContent = response.replace(/---CHANGES---[\s\S]*?---END CHANGES---/g, '').trim();

    // Parse each change block
    for (const changeBlock of changesMatch) {
      const typeMatch = changeBlock.match(/\[type\]:\s*(.+)/);
      const originalMatch = changeBlock.match(/\[original\]:\s*(.+)/);
      const modifiedMatch = changeBlock.match(/\[modified\]:\s*(.+)/);
      const reasonMatch = changeBlock.match(/\[reason\]:\s*(.+)/);

      if (typeMatch && originalMatch && modifiedMatch && reasonMatch) {
        const type = typeMatch[1].trim() as Change['type'];
        if (['citation_added', 'link_removed', 'language_softened', 'claim_removed', 'fact_corrected'].includes(type)) {
          changes.push({
            type,
            original: originalMatch[1].trim(),
            modified: modifiedMatch[1].trim(),
            reason: reasonMatch[1].trim(),
          });
        }
      }
    }
  }

  return { verifiedContent, changes };
}

function extractCitations(content: string): Citation[] {
  const citations: Citation[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  let position = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    citations.push({
      title: match[1],
      url: match[2],
      position: position++,
    });
  }

  return citations;
}

export async function factCheckSection(
  section: ArticleSection,
  clientPrompt: string
): Promise<FactCheckResult> {
  const contentToCheck = section.heading
    ? `## ${section.heading}\n\n${section.original_content}`
    : section.original_content;

  const response = await factCheckWithGPT(contentToCheck, clientPrompt);
  const { verifiedContent, changes } = parseFactCheckResponse(response);
  const citations = extractCitations(verifiedContent);

  // Calculate confidence based on number of changes
  const confidence = Math.max(0, 1 - (changes.length * 0.1));

  return {
    verified_content: verifiedContent,
    citations,
    changes,
    confidence,
  };
}

export async function factCheckAllSections(
  sections: ArticleSection[],
  clientPrompt: string
): Promise<Map<string, FactCheckResult>> {
  const results = new Map<string, FactCheckResult>();

  const promises = sections.map((section) =>
    limit(async () => {
      const result = await factCheckSection(section, clientPrompt);
      results.set(section.id, result);
      return { sectionId: section.id, result };
    })
  );

  await Promise.all(promises);

  return results;
}

// Default fact-checking prompt templates
export const FACT_CHECK_PROMPTS = {
  general: `Please carefully read through this article section and verify every factual claim.
For each claim that needs verification:
1. Search for reliable sources to verify the information
2. If verified, add an inline citation as [anchor text](url)
3. If not verifiable, modify the text to be more accurate or remove the claim
4. Maintain the original tone and style

Return the verified content with inline citations.`,

  finra: `Please carefully read through this article section and verify every point with authoritative sources.

COMPLIANCE REQUIREMENTS (FINRA/SEC):
- All performance claims must be supported by sources
- Use conservative language (avoid "guaranteed", "will", "always")
- Replace absolute statements with qualified language ("may", "could", "typically")
- All statistical claims require citations
- Remove any forward-looking statements that aren't properly disclosed

For each verified claim, add an inline citation as [anchor text](url).
Modify any non-compliant language to meet regulatory standards.
Return the verified content with inline citations.`,

  sec: `Please carefully read through this article section and verify every point with authoritative sources.

SEC COMPLIANCE REQUIREMENTS:
- All investment-related claims must be verifiable
- Include appropriate risk disclosures
- Avoid promissory language about returns
- Ensure balanced presentation of opportunities and risks
- All data must be from authoritative sources

For each verified claim, add an inline citation as [anchor text](url).
Return the verified content with inline citations.`,

  hipaa: `Please carefully read through this article section and verify every medical/health claim.

HIPAA COMPLIANCE REQUIREMENTS:
- All health claims must be from peer-reviewed or authoritative medical sources
- Avoid definitive medical advice - use "consult your healthcare provider" language
- Ensure privacy-related claims are accurate
- Medical statistics must have citations

For each verified claim, add an inline citation as [anchor text](url).
Return the verified content with inline citations.`,
};
