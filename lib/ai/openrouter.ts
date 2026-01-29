const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: OpenRouterTool[];
}

interface OpenRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export async function callOpenRouter(options: OpenRouterOptions): Promise<OpenRouterResponse> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'SEO Article Fact-Checker',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      tools: options.tools,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Claude model for article generation
export const CLAUDE_MODEL = 'anthropic/claude-sonnet-4-20250514';

// GPT model for fact-checking with web search
export const GPT_FACTCHECK_MODEL = 'openai/gpt-4o-search-preview';

export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const response = await callOpenRouter({
    model: CLAUDE_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: 8192,
  });

  return response.choices[0]?.message?.content || '';
}

export async function factCheckWithGPT(
  content: string,
  clientPrompt: string
): Promise<string> {
  const systemPrompt = `You are a professional fact-checker and editor. Your task is to verify claims, add citations, and ensure compliance with guidelines.

When you find information that needs a citation, format it as markdown with inline links:
- Use format: [anchor text](https://source-url.com)
- Place citations naturally within the text
- Keep the original tone and style

For any changes you make, explain them in a structured format at the end of your response:
---CHANGES---
[type]: citation_added | link_removed | language_softened | claim_removed | fact_corrected
[original]: The original text
[modified]: The modified text
[reason]: Why this change was made
---END CHANGES---`;

  const response = await callOpenRouter({
    model: GPT_FACTCHECK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${clientPrompt}\n\n---CONTENT TO VERIFY---\n${content}` },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content || '';
}
