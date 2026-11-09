'use client';

import { useState, type ReactNode } from 'react';
import { cn } from './cn';

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-neutral-200">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === active}
            onClick={() => setActive(item.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium',
              item.value === active
                ? 'border-b-2 border-accent-600 text-accent-700'
                : 'text-neutral-500 hover:text-neutral-900',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div key={item.value} role="tabpanel" hidden={item.value !== active} className="pt-4">
          {item.content}
        </div>
      ))}
    </div>
  );
}
