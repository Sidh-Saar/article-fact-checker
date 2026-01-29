'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Change } from '@/types';

interface ChangeSummaryProps {
  changes: Change[];
  className?: string;
}

const changeTypeConfig: Record<Change['type'], { label: string; color: string }> = {
  citation_added: { label: 'Citation Added', color: 'bg-blue-100 text-blue-800' },
  link_removed: { label: 'Link Removed', color: 'bg-red-100 text-red-800' },
  language_softened: { label: 'Language Softened', color: 'bg-yellow-100 text-yellow-800' },
  claim_removed: { label: 'Claim Removed', color: 'bg-orange-100 text-orange-800' },
  fact_corrected: { label: 'Fact Corrected', color: 'bg-purple-100 text-purple-800' },
};

export function ChangeSummary({ changes, className }: ChangeSummaryProps) {
  // Group changes by type
  const grouped = changes.reduce((acc, change) => {
    if (!acc[change.type]) {
      acc[change.type] = [];
    }
    acc[change.type].push(change);
    return acc;
  }, {} as Record<Change['type'], Change[]>);

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-medium">Changes Made</h4>
      <div className="space-y-2">
        {Object.entries(grouped).map(([type, typeChanges]) => {
          const config = changeTypeConfig[type as Change['type']];
          return (
            <div key={type} className="space-y-1">
              <Badge className={config.color}>
                {config.label} ({typeChanges.length})
              </Badge>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                {typeChanges.map((change, idx) => (
                  <li key={idx} className="list-disc">
                    <span className="text-xs">{change.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChangeStatsProps {
  changes: Change[];
  className?: string;
}

export function ChangeStats({ changes, className }: ChangeStatsProps) {
  const stats = Object.entries(
    changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {stats.map(([type, count]) => {
        const config = changeTypeConfig[type as Change['type']];
        return (
          <Badge key={type} variant="outline" className="text-xs">
            {config.label}: {count}
          </Badge>
        );
      })}
    </div>
  );
}
