import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from './ui/badge';
import { cn } from './ui/cn';

const NAV_ITEMS = [
  { href: '/', label: 'Shipments', key: 'shipments' as const },
  { href: '/reports/accuracy', label: 'Accuracy report', key: 'accuracy' as const },
];

interface AppShellProps {
  user: { name: string; role: string };
  // A pre-built sign-out form/button — same Server Component constraint as
  // ErrorState's retry prop.
  signOutAction: ReactNode;
  // Which nav item to highlight as current; omitted on screens (shipment
  // detail, review) that aren't one of the nav destinations themselves.
  active?: 'shipments' | 'accuracy';
  children: ReactNode;
}

export function AppShell({ user, signOutAction, active, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-neutral-200 bg-neutral-0 p-4 sm:flex">
        <p className="text-sm font-semibold text-neutral-900">Customs AI</p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                active === item.key
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-0 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900 sm:hidden">Customs AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900">{user.name}</span>
            <Badge status="neutral">{user.role}</Badge>
            {signOutAction}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
