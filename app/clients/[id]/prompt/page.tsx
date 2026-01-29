'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PromptEditor } from '@/components/clients/prompt-editor';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import type { Client, ComplianceType } from '@/types';

const COMPLIANCE_TYPES: { value: ComplianceType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'FINRA', label: 'FINRA' },
  { value: 'SEC', label: 'SEC' },
  { value: 'HIPAA', label: 'HIPAA' },
];

export default function ClientPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    fetchClient();
  }, [resolvedParams.id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: client.name,
          industry: client.industry,
          compliance_type: client.compliance_type,
          compliance_guidelines: client.compliance_guidelines,
          fact_check_prompt: client.fact_check_prompt,
          allowed_domains: client.allowed_domains,
        }),
      });

      if (response.ok) {
        router.push('/clients');
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    if (!newDomain || !client) return;
    const domain = newDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!client.allowed_domains.includes(domain)) {
      setClient({
        ...client,
        allowed_domains: [...client.allowed_domains, domain],
      });
    }
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    if (!client) return;
    setClient({
      ...client,
      allowed_domains: client.allowed_domains.filter((d) => d !== domain),
    });
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
          <div className="space-y-6 max-w-3xl mx-auto">
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
                  <p className="text-muted-foreground">
                    Configure fact-checking settings
                  </p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input
                      value={client.industry || ''}
                      onChange={(e) => setClient({ ...client, industry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Compliance Type</Label>
                  <Select
                    value={client.compliance_type || 'none'}
                    onValueChange={(value) => setClient({ ...client, compliance_type: value as ComplianceType })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Fact-Check Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>Fact-Check Prompt</CardTitle>
                <CardDescription>
                  Customize the prompt sent to GPT-5.2 when fact-checking articles for this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromptEditor
                  value={client.fact_check_prompt || ''}
                  onChange={(value) => setClient({ ...client, fact_check_prompt: value })}
                  complianceType={client.compliance_type || undefined}
                />
              </CardContent>
            </Card>

            {/* Compliance Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Guidelines</CardTitle>
                <CardDescription>
                  Extra compliance rules appended to the fact-check prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={client.compliance_guidelines || ''}
                  onChange={(e) => setClient({ ...client, compliance_guidelines: e.target.value })}
                  rows={5}
                  placeholder="e.g., Avoid mentioning competitor products by name..."
                />
              </CardContent>
            </Card>

            {/* Allowed Domains */}
            <Card>
              <CardHeader>
                <CardTitle>Preferred Citation Sources</CardTitle>
                <CardDescription>
                  Domains to prioritize when adding citations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g., reuters.com"
                    onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                  />
                  <Button onClick={addDomain}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.allowed_domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="pl-2 pr-1">
                      {domain}
                      <button
                        onClick={() => removeDomain(domain)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {client.allowed_domains.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No preferred domains set - all sources will be considered equally
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
