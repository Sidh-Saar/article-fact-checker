'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { Client, ArticleWithRelations, ArticleStatus } from '@/types';

const statusConfig: Record<ArticleStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  processing: { label: 'Processing', icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'warning' },
  verified: { label: 'Verified', icon: <AlertCircle className="h-3 w-3" />, variant: 'outline' },
  approved: { label: 'Approved', icon: <CheckCircle className="h-3 w-3" />, variant: 'success' },
};

export default function ClientArticlesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    try {
      const [clientRes, articlesRes] = await Promise.all([
        fetch(`/api/clients/${resolvedParams.id}`),
        fetch(`/api/articles?clientId=${resolvedParams.id}`),
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (articlesRes.ok) setArticles(await articlesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getArticleLink = (article: ArticleWithRelations) => {
    if (article.status === 'verified') {
      return `/clients/${resolvedParams.id}/articles/${article.id}/review`;
    }
    return `/clients/${resolvedParams.id}/articles/${article.id}`;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/clients/${resolvedParams.id}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
                  <p className="text-sm text-muted-foreground">
                    {client.name} &middot; {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href={`/clients/${resolvedParams.id}/articles/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Link>
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Articles List */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No articles found</h3>
                <p className="text-muted-foreground">
                  {articles.length === 0
                    ? 'Generate your first article to get started'
                    : 'Try adjusting your search or filters'}
                </p>
                {articles.length === 0 && (
                  <Button asChild className="mt-4">
                    <Link href={`/clients/${resolvedParams.id}/articles/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Article
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => {
                  const status = statusConfig[article.status];
                  return (
                    <Card key={article.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              <Link href={getArticleLink(article)} className="hover:underline">
                                {article.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {article.skill && (
                                <span className="text-xs">via {article.skill.name}</span>
                              )}
                            </CardDescription>
                          </div>
                          <Badge variant={status.variant} className="flex items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Created {new Date(article.created_at).toLocaleDateString()}
                          </span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={getArticleLink(article)}>
                              {article.status === 'verified' ? 'Review' : 'View'}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
