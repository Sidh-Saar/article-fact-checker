'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { exportToMarkdown, exportToMarkdownWithSourcesList } from '@/lib/article/markdown-export';
import { extractAllCitations } from '@/lib/article/reassembler';
import { Copy, Download, Check, ExternalLink, FileText, List } from 'lucide-react';
import type { ArticleWithRelations, ArticleSection } from '@/types';

interface MarkdownOutputProps {
  article: ArticleWithRelations;
  sections: ArticleSection[];
  open: boolean;
  onClose: () => void;
}

export function MarkdownOutput({ article, sections, open, onClose }: MarkdownOutputProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<string>('inline');

  const inlineMarkdown = exportToMarkdown(article.title, sections, false);
  const withSourcesList = exportToMarkdownWithSourcesList(article.title, sections);
  const citations = extractAllCitations(sections);

  const currentMarkdown = format === 'inline' ? inlineMarkdown : withSourcesList;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Deduplicate citations by URL
  const uniqueCitations = Array.from(
    new Map(citations.map((c) => [c.url, c])).values()
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Article</DialogTitle>
          <DialogDescription>
            Copy or download the verified article with inline citations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={format} onValueChange={setFormat} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inline">
              <FileText className="mr-2 h-4 w-4" />
              Inline Citations
            </TabsTrigger>
            <TabsTrigger value="sources">
              <List className="mr-2 h-4 w-4" />
              With Sources List
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4">
            <TabsContent value="inline" className="h-full m-0">
              <Textarea
                value={inlineMarkdown}
                readOnly
                className="h-[400px] font-mono text-sm resize-none"
              />
            </TabsContent>
            <TabsContent value="sources" className="h-full m-0">
              <Textarea
                value={withSourcesList}
                readOnly
                className="h-[400px] font-mono text-sm resize-none"
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Citations Summary */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-medium">
            {uniqueCitations.length} Citation{uniqueCitations.length !== 1 ? 's' : ''} Added
          </h4>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-auto">
            {uniqueCitations.map((citation, idx) => (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
              >
                {citation.title.substring(0, 30)}
                {citation.title.length > 30 ? '...' : ''}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="text-sm text-muted-foreground">
              {currentMarkdown.split(/\s+/).length} words
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download .md
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
