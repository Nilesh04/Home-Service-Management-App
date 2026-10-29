import React, { Component, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const Surface = ({
  inset = false,
  className = '',
  ...props
}: ComponentProps<'div'> & { inset?: boolean }) => (
  <div
    className={`min-w-0 rounded-card border border-border text-foreground ${
      inset ? 'bg-background' : 'bg-surface shadow-surface'
    } ${className}`}
    {...props}
  />
);

const buttonTones = {
  primary: 'bg-primary text-primary-foreground hover:brightness-95',
  quiet: 'border border-border bg-surface text-foreground hover:bg-background',
  ghost: 'bg-transparent text-foreground hover:bg-background',
  danger: 'bg-danger text-danger-foreground hover:brightness-95',
  dangerQuiet: 'border border-danger/35 bg-surface text-danger hover:bg-danger/5',
} as const;

const buttonSizes = {
  md: 'min-h-11 px-4 py-2 text-sm',
  sm: 'min-h-11 px-3 py-1.5 text-sm md:min-h-9',
} as const;

export const Button = ({
  tone = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'> & {
  tone?: keyof typeof buttonTones;
  size?: keyof typeof buttonSizes;
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-colors active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${buttonTones[tone]} ${buttonSizes[size]} ${className}`}
    {...props}
  />
);

export const Field = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`min-w-0 flex flex-col gap-1.5 ${className}`}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
      {required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-xs font-medium text-danger">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-muted">{hint}</p>
    ) : null}
  </div>
);

const inputBase =
  'min-h-11 w-full min-w-0 rounded-control border border-border bg-surface px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted/75 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60';

export const Input = ({
  className = '',
  hasError = false,
  ...props
}: ComponentProps<'input'> & { hasError?: boolean }) => (
  <input
    aria-invalid={hasError || undefined}
    className={`${inputBase} ${hasError ? 'border-danger focus-visible:outline-danger' : ''} ${className}`}
    {...props}
  />
);

export const Select = ({
  className = '',
  hasError = false,
  children,
  ...props
}: ComponentProps<'select'> & { hasError?: boolean }) => (
  <select
    aria-invalid={hasError || undefined}
    className={`${inputBase} ${hasError ? 'border-danger focus-visible:outline-danger' : ''} ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Textarea = ({
  className = '',
  hasError = false,
  rows = 3,
  ...props
}: ComponentProps<'textarea'> & { hasError?: boolean }) => (
  <textarea
    rows={rows}
    aria-invalid={hasError || undefined}
    className={`w-full min-w-0 rounded-control border border-border bg-surface px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted/75 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${
      hasError ? 'border-danger focus-visible:outline-danger' : ''
    } ${className}`}
    {...props}
  />
);

type BadgeStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Approved';

const statusStyles: Record<
  BadgeStatus,
  { dot: string; text: string }
> = {
  Scheduled: {
    dot: 'bg-primary',
    text: 'text-primary',
  },
  'In Progress': {
    dot: 'bg-warning',
    text: 'text-warning',
  },
  Completed: {
    dot: 'bg-success',
    text: 'text-success',
  },
  Cancelled: {
    dot: 'bg-danger',
    text: 'text-danger',
  },
  Active: {
    dot: 'bg-success',
    text: 'text-success',
  },
  Inactive: {
    dot: 'bg-muted',
    text: 'text-muted',
  },
  Pending: {
    dot: 'bg-warning',
    text: 'text-warning',
  },
  Approved: {
    dot: 'bg-success',
    text: 'text-success',
  },
};

export const StatusBadge = ({
  status,
  className = '',
}: {
  status: BadgeStatus;
  className?: string;
}) => {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium ${style.text} ${className}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

export const StatusBanner = ({
  message,
  tone = 'success',
  onDismiss,
}: {
  message: string | null;
  tone?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}) => {
  if (!message) return null;

  const toneConfig = {
    success: {
      border: 'border-success/40',
      iconColor: 'text-success',
      Icon: CheckCircle2,
    },
    error: {
      border: 'border-danger/40',
      iconColor: 'text-danger',
      Icon: AlertTriangle,
    },
    info: {
      border: 'border-primary/40',
      iconColor: 'text-primary',
      Icon: Info,
    },
  }[tone];

  const IconComponent = toneConfig.Icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-card border bg-surface px-4 py-3 shadow-surface ${toneConfig.border}`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <IconComponent className={`mt-0.5 h-4 w-4 shrink-0 ${toneConfig.iconColor}`} aria-hidden="true" />
        <p className="min-w-0 text-sm font-medium text-foreground">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-1.5 max-w-[32em] text-sm text-muted">{description}</p>
    {actionLabel && onAction ? (
      <div className="mt-5">
        <Button tone="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    ) : null}
  </div>
);

export const Modal = ({
  open,
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-xl',
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-card border border-border bg-surface text-foreground shadow-[var(--shadow-overlay)] sm:rounded-card ${maxWidthClass}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:min-h-9 sm:min-w-9"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    maxWidthClass="max-w-md"
    footer={
      <>
        <Button tone="quiet" onClick={onCancel}>
          Cancel
        </Button>
        <Button tone={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-sm leading-relaxed text-muted">{description}</p>
    {children ? <div className="mt-4">{children}</div> : null}
  </Modal>
);

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-background p-6">
          <Surface className="max-w-md p-6">
            <div role="alert">
              <h1 className="text-lg font-semibold text-foreground">Application interrupted</h1>
              <p className="mt-2 text-sm text-muted">{this.state.message}</p>
              <div className="mt-5">
                <Button tone="primary" onClick={() => window.location.reload()}>
                  Reload application
                </Button>
              </div>
            </div>
          </Surface>
        </div>
      );
    }
    return this.props.children;
  }
}
