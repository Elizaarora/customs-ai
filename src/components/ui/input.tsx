import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-md border bg-neutral-0 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400',
        error ? 'border-danger-border' : 'border-neutral-300',
        className,
      )}
      {...props}
    />
  );
}
