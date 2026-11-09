import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700',
  secondary: 'border border-neutral-300 text-neutral-900 hover:bg-neutral-100',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  danger: 'bg-danger-fg text-white hover:opacity-90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
