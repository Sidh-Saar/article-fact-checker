import type { ClaudeCodeSkillFile, SkillVariable } from '@/types';

interface ParsedSkill {
  name: string;
  description: string;
  promptText: string;
  variables: SkillVariable[];
  originalFile: ClaudeCodeSkillFile;
}

// Extract variables from prompt text using {variable} or {{variable}} patterns
function extractVariables(promptText: string): SkillVariable[] {
  const variables: SkillVariable[] = [];
  const seen = new Set<string>();

  // Match {variable} or {{variable}} patterns
  const patterns = [
    /\{\{(\w+)\}\}/g,  // {{variable}}
    /\{(\w+)\}/g,       // {variable}
    /\$\{(\w+)\}/g,     // ${variable}
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(promptText)) !== null) {
      const varName = match[1];
      if (!seen.has(varName)) {
        seen.add(varName);
        variables.push({
          name: varName,
          description: `Variable: ${varName}`,
          required: true,
        });
      }
    }
  }

  return variables;
}

// Parse a Claude Code skill file (JSON format)
export function parseSkillFile(content: string): ParsedSkill {
  let parsed: ClaudeCodeSkillFile;

  try {
    parsed = JSON.parse(content);
  } catch {
    // If not valid JSON, treat as raw prompt text
    const variables = extractVariables(content);
    return {
      name: 'Imported Skill',
      description: 'Imported from text file',
      promptText: content,
      variables,
      originalFile: { prompt: content },
    };
  }

  // Extract prompt text from various possible structures
  let promptText = '';

  if (typeof parsed.prompt === 'string') {
    promptText = parsed.prompt;
  } else if (Array.isArray(parsed.steps)) {
    // Combine prompts from steps
    promptText = parsed.steps
      .map(step => step.prompt || step.content || '')
      .filter(Boolean)
      .join('\n\n');
  }

  // If still no prompt, look for common field names
  if (!promptText) {
    const possibleFields = ['content', 'text', 'template', 'message'];
    for (const field of possibleFields) {
      if (typeof (parsed as Record<string, unknown>)[field] === 'string') {
        promptText = (parsed as Record<string, unknown>)[field] as string;
        break;
      }
    }
  }

  const variables = extractVariables(promptText);

  return {
    name: parsed.name || 'Unnamed Skill',
    description: parsed.description || '',
    promptText,
    variables,
    originalFile: parsed,
  };
}

// Fill in variable values in a prompt template
export function fillPromptVariables(
  promptText: string,
  values: Record<string, string>
): string {
  let result = promptText;

  for (const [key, value] of Object.entries(values)) {
    // Replace all patterns
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }

  return result;
}

// Validate that all required variables have values
export function validateVariables(
  variables: SkillVariable[],
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const variable of variables) {
    if (variable.required && (!values[variable.name] || values[variable.name].trim() === '')) {
      missing.push(variable.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
