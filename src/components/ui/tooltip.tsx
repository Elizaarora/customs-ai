'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from './cn';

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={id} tabIndex={0}>
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white transition-opacity',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {label}
      </span>
    </span>
  );
}
