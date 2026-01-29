'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Link from 'next/link';
import type { Skill, Client } from '@/types';

function NewArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSkillId = searchParams.get('skillId');

  const [tab, setTab] = useState<string>(preselectedSkillId ? 'generate' : 'manual');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState(preselectedSkillId || '');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  useEffect(() => {
    fetchData();
  }, []);

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
      const [skillsRes, clientsRes] = await Promise.all([
        fetch('/api/skills'),
        fetch('/api/clients'),
      ]);

      if (skillsRes.ok) {
        setSkills(await skillsRes.json());
      }
      if (clientsRes.ok) {
        setClients(await clientsRes.json());
      }
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
          client_id: selectedClientId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const article = await response.json();
      router.push(`/articles/${article.id}`);
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
          client_id: selectedClientId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create article');
      }

      const article = await response.json();
      router.push(`/articles/${article.id}`);
    } catch (error) {
      console.error('Error creating article:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/articles">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">New Article</h1>
                <p className="text-muted-foreground">
                  Generate with AI or create manually
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

                    <div className="space-y-2">
                      <Label>Client (Optional)</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Client-specific fact-checking prompts will be used during verification
                      </p>
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

                    <div className="space-y-2">
                      <Label>Client (Optional)</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
      </main>
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewArticleForm />
    </Suspense>
  );
}
