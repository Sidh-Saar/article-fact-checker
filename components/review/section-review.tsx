'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SideBySideDiff } from './diff-viewer';
import { ChangeSummary } from './change-summary';
import { Check, X, Edit2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { ArticleSection } from '@/types';
import { cn } from '@/lib/utils';

interface SectionReviewProps {
  section: ArticleSection;
  onApprove: (sectionId: string) => void;
  onReject: (sectionId: string) => void;
  onEdit: (sectionId: string, content: string) => void;
}

export function SectionReview({ section, onApprove, onReject, onEdit }: SectionReviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(section.verified_content || '');

  const handleSaveEdit = () => {
    onEdit(section.id, editContent);
    setEditOpen(false);
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    processing: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <>
      <Card className={cn(
        'transition-all',
        section.status === 'approved' && 'border-green-200 bg-green-50/50',
        section.status === 'rejected' && 'border-red-200 bg-red-50/50'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  Section {section.section_index + 1}
                  {section.heading && `: ${section.heading}`}
                </CardTitle>
                <Badge className={statusColors[section.status]}>
                  {section.status}
                </Badge>
              </div>
              <CardDescription>
                {section.changes.length} change{section.changes.length !== 1 ? 's' : ''} |{' '}
                {section.citations.length} citation{section.citations.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {section.status === 'verified' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReject(section.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => onApprove(section.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {/* Changes Summary */}
            {section.changes.length > 0 && (
              <ChangeSummary changes={section.changes} />
            )}

            {/* Citations */}
            {section.citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Citations Added</h4>
                <div className="flex flex-wrap gap-2">
                  {section.citations.map((citation, idx) => (
                    <a
                      key={idx}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      {citation.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Content Diff */}
            <SideBySideDiff
              original={section.original_content}
              modified={section.verified_content || section.original_content}
            />
          </CardContent>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Section Content</DialogTitle>
            <DialogDescription>
              Make manual adjustments to the verified content
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={15}
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
