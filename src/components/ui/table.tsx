import type { ReactNode, TableHTMLAttributes } from 'react';
import { cn } from './cn';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full text-left text-sm tabular-nums', className)} {...props} />;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-neutral-200 text-xs text-neutral-500">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-b border-neutral-100 last:border-0', className)}>{children}</tr>;
}

export function TableCell({
  children,
  className,
  header,
}: {
  children?: ReactNode;
  className?: string;
  header?: boolean;
}) {
  const Tag = header ? 'th' : 'td';
  return <Tag className={cn('py-2 pr-4', className)}>{children}</Tag>;
}
