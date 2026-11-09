import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="text-neutral-400">{icon}</div>
      <p className="font-medium text-neutral-900">{title}</p>
      {hint && <p className="text-sm text-neutral-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
