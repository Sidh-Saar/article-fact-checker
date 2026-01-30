'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useSupabase();

  if (!user) return null;

  // Build breadcrumbs based on current path
  const getBreadcrumbs = (): Breadcrumb[] => {
    const crumbs: Breadcrumb[] = [{ label: 'Clients', href: '/clients' }];

    // Check if we're in a client detail page
    const clientMatch = pathname.match(/^\/clients\/([^/]+)/);
    if (clientMatch) {
      const clientId = clientMatch[1];

      // Add client placeholder (will be replaced by actual name via context)
      if (pathname.includes('/skills')) {
        crumbs.push({ label: 'Skills' });
      } else if (pathname.includes('/articles/new')) {
        crumbs.push({ label: 'Articles', href: `/clients/${clientId}/articles` });
        crumbs.push({ label: 'New' });
      } else if (pathname.includes('/articles')) {
        crumbs.push({ label: 'Articles' });
      } else if (pathname.includes('/settings')) {
        crumbs.push({ label: 'Settings' });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isClientsActive = pathname.startsWith('/clients');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/clients" className="mr-6 flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-bold">Fact-Checker</span>
          </Link>
          <nav className="flex items-center space-x-2 text-sm font-medium">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={cn(
                      'transition-colors hover:text-foreground/80',
                      index === breadcrumbs.length - 1 ? 'text-foreground' : 'text-foreground/60'
                    )}
                  >
                    {index === 0 && <Users className="inline-block h-4 w-4 mr-1" />}
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
