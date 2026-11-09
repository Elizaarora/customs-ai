import type { ReactNode } from 'react';
import { cn } from './cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-md border border-neutral-200 bg-neutral-0 p-4 shadow-card', className)}>
      {children}
    </div>
  );
}
