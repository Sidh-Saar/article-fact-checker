'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Wand2,
  FileText,
  Settings,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { Client, Skill, ArticleWithRelations, ArticleStatus } from '@/types';

const statusConfig: Record<ArticleStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  processing: { label: 'Processing', icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'warning' },
  verified: { label: 'Verified', icon: <AlertCircle className="h-3 w-3" />, variant: 'outline' },
  approved: { label: 'Approved', icon: <CheckCircle className="h-3 w-3" />, variant: 'success' },
};

export default function ClientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    try {
      const [clientRes, skillsRes, articlesRes] = await Promise.all([
        fetch(`/api/clients/${resolvedParams.id}`),
        fetch(`/api/skills?clientId=${resolvedParams.id}`),
        fetch(`/api/articles?clientId=${resolvedParams.id}`),
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (skillsRes.ok) setSkills(await skillsRes.json());
      if (articlesRes.ok) setArticles(await articlesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const recentArticles = articles.slice(0, 5);

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
                  <Link href="/clients">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {client.industry && (
                      <span className="text-sm text-muted-foreground">{client.industry}</span>
                    )}
                    {client.compliance_type && client.compliance_type !== 'none' && (
                      <Badge variant="secondary">{client.compliance_type}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/clients/${resolvedParams.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Skills Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      Skills
                    </CardTitle>
                    <Badge variant="secondary">{skills.length}</Badge>
                  </div>
                  <CardDescription>
                    Content generation templates for this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/clients/${resolvedParams.id}/skills`}>
                        Manage Skills
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Articles Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Articles
                    </CardTitle>
                    <Badge variant="secondary">{articles.length}</Badge>
                  </div>
                  <CardDescription>
                    Generated and fact-checked articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex-1">
                      <Link href={`/clients/${resolvedParams.id}/articles`}>
                        View All
                      </Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/clients/${resolvedParams.id}/articles/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Article
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Articles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Articles</CardTitle>
                  {articles.length > 5 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${resolvedParams.id}/articles`}>
                        View all
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No articles yet</p>
                    <Button asChild className="mt-4">
                      <Link href={`/clients/${resolvedParams.id}/articles/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate First Article
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentArticles.map((article) => {
                      const status = statusConfig[article.status];
                      return (
                        <div
                          key={article.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <Link
                              href={getArticleLink(article)}
                              className="font-medium hover:underline truncate block"
                            >
                              {article.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {new Date(article.created_at).toLocaleDateString()}
                              </span>
                              {article.skill && (
                                <span className="text-xs text-muted-foreground">
                                  via {article.skill.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={status.variant} className="flex items-center gap-1 ml-4">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
