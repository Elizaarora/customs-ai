import type { ReactNode } from 'react';

interface ErrorStateProps {
  message: string;
  // A pre-built action (e.g. a <Button> inside a <form action={...}>), not a
  // callback — most screens in this app are Server Components, which can't
  // pass plain functions to a client child.
  retry?: ReactNode;
}

export function ErrorState({ message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-danger-border bg-danger-bg px-4 py-8 text-center">
      <p className="font-medium text-danger-fg">{message}</p>
      {retry}
    </div>
  );
}
