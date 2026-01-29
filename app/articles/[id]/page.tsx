'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Play,
  Trash2,
  Eye,
  Code,
} from 'lucide-react';
import type { ArticleWithRelations } from '@/types';

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<string>('preview');

  useEffect(() => {
    fetchArticle();
  }, [resolvedParams.id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
        router.push(`/articles/${resolvedParams.id}/review`);
      }
    } catch (error) {
      console.error('Error verifying article:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/articles');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig = {
    draft: { label: 'Draft', icon: <Clock className="h-4 w-4" />, color: 'bg-gray-100' },
    processing: { label: 'Processing', icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'bg-yellow-100' },
    verified: { label: 'Verified', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-blue-100' },
    approved: { label: 'Approved', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100' },
  };

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

  if (!article) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Article not found</p>
        </main>
      </div>
    );
  }

  const status = statusConfig[article.status];

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/articles">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {status.icon}
                      {status.label}
                    </Badge>
                    {article.client && (
                      <Badge variant="outline">{article.client.name}</Badge>
                    )}
                    {article.skill && (
                      <span className="text-sm text-muted-foreground">
                        via {article.skill.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {article.status === 'draft' && (
                  <Button onClick={handleVerify} disabled={verifying}>
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Fact-Check
                      </>
                    )}
                  </Button>
                )}
                {article.status === 'verified' && (
                  <Button asChild>
                    <Link href={`/articles/${article.id}/review`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Review Changes
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content</CardTitle>
                  <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList>
                      <TabsTrigger value="preview">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="source">
                        <Code className="mr-2 h-4 w-4" />
                        Source
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {article.original_content.split(/\s+/).length} words
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viewMode === 'preview' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: article.original_content
                          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                          .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                          .replace(/\*(.*)\*/gim, '<em>$1</em>')
                          .replace(/\n/gim, '<br />'),
                      }}
                    />
                  </div>
                ) : (
                  <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">
                    {article.original_content}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">
                      {new Date(article.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">{status.label}</dd>
                  </div>
                  {article.client && (
                    <div>
                      <dt className="text-muted-foreground">Client</dt>
                      <dd className="font-medium">{article.client.name}</dd>
                    </div>
                  )}
                  {article.skill && (
                    <div>
                      <dt className="text-muted-foreground">Skill Used</dt>
                      <dd className="font-medium">{article.skill.name}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{article.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
