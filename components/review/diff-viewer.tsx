'use client';

import { cn } from '@/lib/utils';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
}

interface DiffViewerProps {
  original: string;
  modified: string;
  className?: string;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const result: DiffLine[] = [];

  // Simple line-by-line diff
  const maxLen = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLen; i++) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[i];

    if (origLine === modLine) {
      if (origLine !== undefined) {
        result.push({ type: 'unchanged', content: origLine });
      }
    } else {
      if (origLine !== undefined) {
        result.push({ type: 'removed', content: origLine });
      }
      if (modLine !== undefined) {
        result.push({ type: 'added', content: modLine });
      }
    }
  }

  return result;
}

export function DiffViewer({ original, modified, className }: DiffViewerProps) {
  const diffLines = computeDiff(original, modified);

  return (
    <div className={cn('font-mono text-sm rounded-lg border overflow-auto', className)}>
      <div className="p-4 space-y-0.5">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={cn(
              'px-2 py-0.5 rounded',
              line.type === 'added' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
              line.type === 'removed' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
              line.type === 'unchanged' && 'text-muted-foreground'
            )}
          >
            <span className="inline-block w-4 text-xs opacity-50 mr-2">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            {line.content || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SideBySideDiffProps {
  original: string;
  modified: string;
  className?: string;
}

export function SideBySideDiff({ original, modified, className }: SideBySideDiffProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Original</h4>
        <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
          {original}
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Verified</h4>
        <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
          {modified}
        </div>
      </div>
    </div>
  );
}
