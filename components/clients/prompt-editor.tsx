'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FACT_CHECK_PROMPTS } from '@/lib/ai/fact-checker';
import { Check, Copy, RotateCcw } from 'lucide-react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  complianceType?: string;
}

export function PromptEditor({ value, onChange, complianceType }: PromptEditorProps) {
  const [copied, setCopied] = useState(false);

  const templates = [
    { id: 'general', name: 'General', prompt: FACT_CHECK_PROMPTS.general },
    { id: 'finra', name: 'FINRA', prompt: FACT_CHECK_PROMPTS.finra },
    { id: 'sec', name: 'SEC', prompt: FACT_CHECK_PROMPTS.sec },
    { id: 'hipaa', name: 'HIPAA', prompt: FACT_CHECK_PROMPTS.hipaa },
  ];

  const handleUseTemplate = (prompt: string) => {
    onChange(prompt);
  };

  const handleReset = () => {
    const defaultPrompt = complianceType && complianceType !== 'none'
      ? FACT_CHECK_PROMPTS[complianceType.toLowerCase() as keyof typeof FACT_CHECK_PROMPTS]
      : FACT_CHECK_PROMPTS.general;
    onChange(defaultPrompt || FACT_CHECK_PROMPTS.general);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Fact-Check Prompt</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        className="font-mono text-sm"
        placeholder="Enter your custom fact-checking prompt..."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Templates</CardTitle>
          <CardDescription className="text-xs">
            Start with a template and customize as needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleUseTemplate(template.prompt)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        This prompt will be sent to GPT-5.2 with web search capabilities when fact-checking articles for this client.
        Include specific instructions about compliance requirements, citation preferences, and language guidelines.
      </p>
    </div>
  );
}
