'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit2, Trash2, Copy, Wand2 } from 'lucide-react';
import type { Skill } from '@/types';

interface SkillCardProps {
  skill: Skill;
  onUpdate: () => void;
  onDelete: () => void;
  onUse: (skill: Skill) => void;
}

export function SkillCard({ skill, onUpdate, onDelete, onUse }: SkillCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: skill.name,
    description: skill.description || '',
    prompt_text: skill.prompt_text,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update');

      setEditOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setDeleteOpen(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(skill.prompt_text);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              {skill.category && (
                <Badge variant="secondary">{skill.category}</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={copyPrompt}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          {skill.description && (
            <CardDescription className="line-clamp-2">
              {skill.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-muted p-2 rounded">
              {skill.prompt_text.substring(0, 200)}...
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {skill.variables.length} variable{skill.variables.length !== 1 ? 's' : ''}
            </div>
            <Button size="sm" onClick={() => onUse(skill)}>
              <Wand2 className="mr-2 h-4 w-4" />
              Use Skill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Modify the skill name, description, or prompt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={editForm.prompt_text}
                onChange={(e) => setEditForm({ ...editForm, prompt_text: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{skill.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
