import type { ReactNode } from 'react';
import { cn } from './cn';

type Status = 'needs-review' | 'failed' | 'confirmed' | 'neutral';

const STATUS_CLASSES: Record<Status, string> = {
  'needs-review': 'bg-warning-bg text-warning-fg',
  failed: 'bg-danger-bg text-danger-fg',
  confirmed: 'bg-success-bg text-success-fg',
  neutral: 'bg-neutral-100 text-neutral-700',
};

interface BadgeProps {
  status?: Status;
  children: ReactNode;
}

export function Badge({ status = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status],
      )}
    >
      {children}
    </span>
  );
}
