'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionReview } from '@/components/review/section-review';
import { ChangeStats } from '@/components/review/change-summary';
import { MarkdownOutput } from '@/components/export/markdown-output';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Download,
  Loader2,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import type { ArticleWithRelations, ArticleSection, Change } from '@/types';

export default function ArticleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showExport, setShowExport] = useState(false);

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

  const handleApproveSection = async (sectionId: string) => {
    if (!article) return;

    // Optimistic update
    setArticle({
      ...article,
      sections: article.sections?.map((s) =>
        s.id === sectionId ? { ...s, status: 'approved' as const } : s
      ),
    });

    try {
      await fetch(`/api/articles/${resolvedParams.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_sections: [sectionId] }),
      });
    } catch (error) {
      console.error('Error approving section:', error);
      fetchArticle(); // Revert on error
    }
  };

  const handleRejectSection = (sectionId: string) => {
    if (!article) return;

    setArticle({
      ...article,
      sections: article.sections?.map((s) =>
        s.id === sectionId ? { ...s, status: 'rejected' as const } : s
      ),
    });
  };

  const handleEditSection = async (sectionId: string, content: string) => {
    if (!article) return;

    setArticle({
      ...article,
      sections: article.sections?.map((s) =>
        s.id === sectionId ? { ...s, verified_content: content } : s
      ),
    });
  };

  const handleApproveAll = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_sections: 'all' }),
      });

      if (response.ok) {
        fetchArticle();
        setShowExport(true);
      }
    } catch (error) {
      console.error('Error approving all:', error);
    } finally {
      setApproving(false);
    }
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

  if (!article || !article.sections) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Article not found or not verified</p>
        </main>
      </div>
    );
  }

  const sections = article.sections as ArticleSection[];
  const allChanges = sections.flatMap((s) => s.changes);
  const totalCitations = sections.reduce((sum, s) => sum + s.citations.length, 0);
  const approvedCount = sections.filter((s) => s.status === 'approved').length;
  const allApproved = approvedCount === sections.length;

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
                  <Link href={`/articles/${resolvedParams.id}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Review: {article.title}
                  </h1>
                  <p className="text-muted-foreground">
                    Review and approve fact-checked sections
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {allApproved || article.status === 'approved' ? (
                  <Button onClick={() => setShowExport(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                ) : (
                  <Button onClick={handleApproveAll} disabled={approving}>
                    {approving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Approve All
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sections.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {approvedCount} approved
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allChanges.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Citations Added</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCitations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((approvedCount / sections.length) * 100)}%
                  </div>
                  <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(approvedCount / sections.length) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Change Types Breakdown */}
            {allChanges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Changes by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChangeStats changes={allChanges} />
                </CardContent>
              </Card>
            )}

            {/* Sections */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sections</h2>
              {sections.map((section) => (
                <SectionReview
                  key={section.id}
                  section={section}
                  onApprove={handleApproveSection}
                  onReject={handleRejectSection}
                  onEdit={handleEditSection}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExport && (
        <MarkdownOutput
          article={article}
          sections={sections}
          open={showExport}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
