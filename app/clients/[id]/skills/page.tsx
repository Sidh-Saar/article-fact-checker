'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Upload,
  Search,
  Wand2,
  Trash2,
  FileJson,
  Loader2,
} from 'lucide-react';
import type { Client, Skill } from '@/types';

const CATEGORIES = [
  'SEO',
  'Blog',
  'Social Media',
  'Email',
  'Technical',
  'Marketing',
  'Other',
];

export default function ClientSkillsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    try {
      const [clientRes, skillsRes] = await Promise.all([
        fetch(`/api/clients/${resolvedParams.id}`),
        fetch(`/api/skills?clientId=${resolvedParams.id}`),
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (skillsRes.ok) setSkills(await skillsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError('');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setImportError('Please select a file');
      return;
    }

    setImporting(true);
    setImportError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clientId', resolvedParams.id);
      if (category) {
        formData.append('category', category);
      }

      const response = await fetch('/api/skills/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import skill');
      }

      setImportOpen(false);
      setSelectedFile(null);
      setCategory('');
      fetchData();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import skill');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    try {
      const response = await fetch(`/api/skills/${skillId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(search.toLowerCase()) ||
    skill.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Client not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/clients/${resolvedParams.id}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
                  <p className="text-sm text-muted-foreground">
                    {client.name} &middot; {skills.length} skill{skills.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Claude Code Skill</DialogTitle>
                    <DialogDescription>
                      Upload a JSON skill file from Claude Code
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Skill File</Label>
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept=".json,.txt"
                          className="hidden"
                        />
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileJson className="h-5 w-5 text-primary" />
                            <span className="text-sm">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to select a skill file</p>
                            <p className="text-xs mt-1">Supports .json and .txt files</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Category (Optional)</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {importError && (
                      <p className="text-sm text-destructive">{importError}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={importing || !selectedFile}>
                      {importing ? 'Importing...' : 'Import'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Skills Grid */}
            {filteredSkills.length === 0 ? (
              <div className="text-center py-12">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No skills found</h3>
                <p className="text-muted-foreground">
                  {skills.length === 0
                    ? 'Import your first skill to generate content'
                    : 'Try adjusting your search'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.map((skill) => (
                  <Card key={skill.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{skill.name}</CardTitle>
                          {skill.description && (
                            <CardDescription className="line-clamp-2">
                              {skill.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(skill.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        {skill.category && (
                          <Badge variant="secondary">{skill.category}</Badge>
                        )}
                        {skill.variables.length > 0 && (
                          <Badge variant="outline">
                            {skill.variables.length} variable{skill.variables.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link href={`/clients/${resolvedParams.id}/articles/new?skillId=${skill.id}`}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Article
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
