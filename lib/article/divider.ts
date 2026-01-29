interface Section {
  heading: string | null;
  content: string;
  index: number;
}

interface DivisionResult {
  sections: Section[];
  totalSections: number;
}

// Target constraints
const MIN_SECTIONS = 4;
const MAX_SECTIONS = 6;
const MIN_WORDS_PER_SECTION = 200;
const MAX_WORDS_PER_SECTION = 800;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function extractHeadings(markdown: string): { level: number; text: string; position: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; position: number }[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      position: match.index,
    });
  }

  return headings;
}

function splitAtHeadings(markdown: string, level: number): Section[] {
  const sections: Section[] = [];
  const regex = level === 2
    ? /^##\s+(.+)$/gm
    : /^###\s+(.+)$/gm;

  const parts = markdown.split(regex);

  // First part before any heading
  if (parts[0].trim()) {
    sections.push({
      heading: null,
      content: parts[0].trim(),
      index: 0,
    });
  }

  // Subsequent parts with headings
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i];
    const content = parts[i + 1] || '';

    if (content.trim()) {
      sections.push({
        heading,
        content: content.trim(),
        index: sections.length,
      });
    }
  }

  return sections;
}

function splitByParagraphs(content: string, targetSections: number): Section[] {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const totalWords = countWords(content);
  const wordsPerSection = Math.ceil(totalWords / targetSections);

  const sections: Section[] = [];
  let currentContent = '';
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);

    if (currentWords + paragraphWords > wordsPerSection && currentContent && sections.length < targetSections - 1) {
      sections.push({
        heading: null,
        content: currentContent.trim(),
        index: sections.length,
      });
      currentContent = paragraph;
      currentWords = paragraphWords;
    } else {
      currentContent += (currentContent ? '\n\n' : '') + paragraph;
      currentWords += paragraphWords;
    }
  }

  // Add remaining content
  if (currentContent.trim()) {
    sections.push({
      heading: null,
      content: currentContent.trim(),
      index: sections.length,
    });
  }

  return sections;
}

function mergeSections(sections: Section[], maxSections: number): Section[] {
  if (sections.length <= maxSections) return sections;

  const merged: Section[] = [];
  const sectionsPerGroup = Math.ceil(sections.length / maxSections);

  for (let i = 0; i < sections.length; i += sectionsPerGroup) {
    const group = sections.slice(i, i + sectionsPerGroup);
    const firstHeading = group.find(s => s.heading)?.heading || null;
    const combinedContent = group.map(s => {
      if (s.heading && s.heading !== firstHeading) {
        return `### ${s.heading}\n\n${s.content}`;
      }
      return s.content;
    }).join('\n\n');

    merged.push({
      heading: firstHeading,
      content: combinedContent,
      index: merged.length,
    });
  }

  return merged;
}

function splitLargeSections(sections: Section[], minSections: number): Section[] {
  if (sections.length >= minSections) return sections;

  const result: Section[] = [];
  const sectionsNeeded = minSections - sections.length;
  const avgWordsPerExtraSection = sections.reduce((sum, s) => sum + countWords(s.content), 0) / minSections;

  for (const section of sections) {
    const words = countWords(section.content);

    if (words > avgWordsPerExtraSection * 1.5 && result.length + (sections.length - sections.indexOf(section)) < minSections) {
      // Split this section
      const subSections = splitByParagraphs(section.content, 2);

      for (let i = 0; i < subSections.length; i++) {
        result.push({
          heading: i === 0 ? section.heading : null,
          content: subSections[i].content,
          index: result.length,
        });
      }
    } else {
      result.push({
        ...section,
        index: result.length,
      });
    }
  }

  return result;
}

export function divideArticle(markdown: string): DivisionResult {
  // Step 1: Try to split at H2 headings
  let sections = splitAtHeadings(markdown, 2);

  // Step 2: If too few sections, try H3 headings
  if (sections.length < MIN_SECTIONS) {
    const h3Sections: Section[] = [];

    for (const section of sections) {
      const subSections = splitAtHeadings(
        section.heading ? `## ${section.heading}\n\n${section.content}` : section.content,
        3
      );

      if (subSections.length > 1) {
        h3Sections.push(...subSections.map((s, i) => ({
          ...s,
          heading: i === 0 ? section.heading : s.heading,
          index: h3Sections.length + i,
        })));
      } else {
        h3Sections.push({
          ...section,
          index: h3Sections.length,
        });
      }
    }

    sections = h3Sections;
  }

  // Step 3: If still too few, split by paragraphs
  if (sections.length < MIN_SECTIONS) {
    sections = splitLargeSections(sections, MIN_SECTIONS);
  }

  // Step 4: If still not enough, split by paragraphs entirely
  if (sections.length < MIN_SECTIONS) {
    sections = splitByParagraphs(markdown, MIN_SECTIONS);
  }

  // Step 5: If too many, merge adjacent small sections
  if (sections.length > MAX_SECTIONS) {
    sections = mergeSections(sections, MAX_SECTIONS);
  }

  // Reindex
  sections = sections.map((s, i) => ({ ...s, index: i }));

  return {
    sections,
    totalSections: sections.length,
  };
}

export function validateSections(sections: Section[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (sections.length < MIN_SECTIONS) {
    warnings.push(`Only ${sections.length} sections (minimum is ${MIN_SECTIONS})`);
  }

  if (sections.length > MAX_SECTIONS) {
    warnings.push(`${sections.length} sections exceeds maximum of ${MAX_SECTIONS}`);
  }

  for (const section of sections) {
    const words = countWords(section.content);
    if (words < MIN_WORDS_PER_SECTION) {
      warnings.push(`Section ${section.index + 1} has only ${words} words (minimum is ${MIN_WORDS_PER_SECTION})`);
    }
    if (words > MAX_WORDS_PER_SECTION) {
      warnings.push(`Section ${section.index + 1} has ${words} words (maximum is ${MAX_WORDS_PER_SECTION})`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
