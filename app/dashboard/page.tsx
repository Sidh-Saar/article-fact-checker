import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Wand2, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats
  const [articlesResult, skillsResult, clientsResult] = await Promise.all([
    supabase.from('articles').select('id, status', { count: 'exact' }).eq('created_by', user?.id),
    supabase.from('skills').select('id', { count: 'exact' }),
    supabase.from('clients').select('id', { count: 'exact' }),
  ]);

  const articles = articlesResult.data || [];
  const skillsCount = skillsResult.count || 0;
  const clientsCount = clientsResult.count || 0;

  const draftCount = articles.filter(a => a.status === 'draft').length;
  const processingCount = articles.filter(a => a.status === 'processing').length;
  const verifiedCount = articles.filter(a => a.status === 'verified').length;
  const approvedCount = articles.filter(a => a.status === 'approved').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your fact-checking workflow
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/articles/new">
            <FileText className="mr-2 h-4 w-4" />
            Generate Article
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/skills">
            <Wand2 className="mr-2 h-4 w-4" />
            Manage Skills
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/clients">
            <Users className="mr-2 h-4 w-4" />
            Manage Clients
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">
              {approvedCount} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillsCount}</div>
            <p className="text-xs text-muted-foreground">
              Available prompts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
            <p className="text-xs text-muted-foreground">
              With custom prompts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Article Status</CardTitle>
            <CardDescription>Current status of all articles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-sm">Draft</span>
              </div>
              <span className="text-sm font-medium">{draftCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm">Processing</span>
              </div>
              <span className="text-sm font-medium">{processingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-sm">Verified</span>
              </div>
              <span className="text-sm font-medium">{verifiedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm">Approved</span>
              </div>
              <span className="text-sm font-medium">{approvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick guide to fact-checking workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Import Skills</p>
                <p className="text-xs text-muted-foreground">Upload Claude Code skill files</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Generate Articles</p>
                <p className="text-xs text-muted-foreground">Use skills to create content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Fact-Check</p>
                <p className="text-xs text-muted-foreground">AI verifies and adds citations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </div>
              <div>
                <p className="text-sm font-medium">Review & Export</p>
                <p className="text-xs text-muted-foreground">Approve changes and download</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
