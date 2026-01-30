'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Wand2, FileText, Loader2 } from 'lucide-react';
import type { Skill, Client } from '@/types';

function NewArticleForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSkillId = searchParams.get('skillId');

  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<string>(preselectedSkillId ? 'generate' : 'manual');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState(preselectedSkillId || '');
  const [variables, setVariables] = useState<Record<string, string>>({});

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  useEffect(() => {
    if (selectedSkill) {
      const initialVars: Record<string, string> = {};
      selectedSkill.variables.forEach((v) => {
        initialVars[v.name] = '';
      });
      setVariables(initialVars);
    }
  }, [selectedSkill]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientRes, skillsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/skills?clientId=${clientId}`),
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (skillsRes.ok) setSkills(await skillsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSkillId) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/generate/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: selectedSkillId,
          variables,
          title: title || undefined,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const article = await response.json();
      router.push(`/clients/${clientId}/articles/${article.id}`);
    } catch (error) {
      console.error('Error generating article:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleManualCreate = async () => {
    if (!title || !content) return;

    setLoading(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          original_content: content,
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create article');
      }

      const article = await response.json();
      router.push(`/clients/${clientId}/articles/${article.id}`);
    } catch (error) {
      console.error('Error creating article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/clients/${clientId}/articles`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Article</h1>
            <p className="text-sm text-muted-foreground">
              {client?.name} &middot; Generate with AI or create manually
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate with AI
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileText className="mr-2 h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Article</CardTitle>
                <CardDescription>
                  Select a skill and fill in the variables to generate content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.length === 0 ? (
                  <div className="text-center py-8">
                    <Wand2 className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No skills available</p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link href={`/clients/${clientId}/skills`}>
                        Import Skills First
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Skill *</Label>
                      <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {skills.map((skill) => (
                            <SelectItem key={skill.id} value={skill.id}>
                              {skill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSkill && selectedSkill.variables.length > 0 && (
                      <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <Label className="text-sm font-medium">Variables</Label>
                        {selectedSkill.variables.map((variable) => (
                          <div key={variable.name} className="space-y-2">
                            <Label className="text-sm">
                              {variable.name}
                              {variable.required && <span className="text-destructive"> *</span>}
                            </Label>
                            {variable.description && (
                              <p className="text-xs text-muted-foreground">{variable.description}</p>
                            )}
                            <Input
                              value={variables[variable.name] || ''}
                              onChange={(e) =>
                                setVariables({ ...variables, [variable.name]: e.target.value })
                              }
                              placeholder={`Enter ${variable.name}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Title (Optional)</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Article title (auto-generated if empty)"
                      />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={!selectedSkillId || generating}
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Article
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Paste or write your article content directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your article content here (Markdown supported)"
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleManualCreate}
                  disabled={!title || !content || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Article
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function NewClientArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <NewArticleForm clientId={resolvedParams.id} />
        </Suspense>
      </main>
    </div>
  );
}
