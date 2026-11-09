'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from './cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Native <dialog> — free focus trap, Escape-to-close, and keyboard support,
// no headless-UI dependency needed.
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        'w-full max-w-md rounded-md border border-neutral-200 p-0 shadow-card backdrop:bg-neutral-900/40',
      )}
    >
      <div className="p-4">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}
