'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from './cn';

type ToastVariant = 'default' | 'success' | 'danger';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (text: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: 'bg-neutral-900 text-white',
  success: 'border border-success-border bg-success-bg text-success-fg',
  danger: 'border border-danger-border bg-danger-bg text-danger-fg',
};

const DISPLAY_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, variant: ToastVariant = 'default') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, text, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn('rounded-md px-3 py-2 text-sm shadow-card', VARIANT_CLASSES[toast.variant])}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
