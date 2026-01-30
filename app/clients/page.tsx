'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Users, Search, Settings, Trash2, ArrowRight } from 'lucide-react';
import type { Client, ComplianceType } from '@/types';
import { FACT_CHECK_PROMPTS } from '@/lib/ai/fact-checker';

const COMPLIANCE_TYPES: { value: ComplianceType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'FINRA', label: 'FINRA' },
  { value: 'SEC', label: 'SEC' },
  { value: 'HIPAA', label: 'HIPAA' },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    industry: '',
    compliance_type: 'none' as ComplianceType,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newClient.name) return;

    setCreating(true);
    setError('');
    try {
      // Get default prompt based on compliance type
      const defaultPrompt = newClient.compliance_type !== 'none'
        ? FACT_CHECK_PROMPTS[newClient.compliance_type.toLowerCase() as keyof typeof FACT_CHECK_PROMPTS]
        : FACT_CHECK_PROMPTS.general;

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClient,
          fact_check_prompt: defaultPrompt,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create client');
        return;
      }

      setCreateOpen(false);
      setNewClient({ name: '', industry: '', compliance_type: 'none' });
      fetchClients();
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground">
                  Manage clients, skills, and articles
                </p>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client with custom fact-checking settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={newClient.industry}
                        onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                        placeholder="e.g., Finance, Healthcare"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Compliance Type</Label>
                      <Select
                        value={newClient.compliance_type}
                        onValueChange={(value) => setNewClient({ ...newClient, compliance_type: value as ComplianceType })}
                      >
                        <SelectTrigger>
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
                      <p className="text-xs text-muted-foreground">
                        A default prompt template will be created based on this
                      </p>
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!newClient.name || creating}>
                      {creating ? 'Creating...' : 'Create Client'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Clients Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
                <p className="text-muted-foreground">
                  {clients.length === 0
                    ? 'Add your first client to customize fact-checking'
                    : 'Try adjusting your search'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <Link href={`/clients/${client.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{client.name}</CardTitle>
                            {client.industry && (
                              <CardDescription>{client.industry}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/clients/${client.id}/settings`}>
                                <Settings className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(client.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {client.compliance_type && client.compliance_type !== 'none' && (
                            <Badge variant="secondary">{client.compliance_type}</Badge>
                          )}
                          {client.fact_check_prompt && (
                            <Badge variant="outline">Custom Prompt</Badge>
                          )}
                        </div>
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                          <span>View client</span>
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Link>
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
