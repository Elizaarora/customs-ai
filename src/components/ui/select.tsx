import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-1.5 text-sm text-neutral-900',
        className,
      )}
      {...props}
    />
  );
}
