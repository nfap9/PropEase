import * as React from 'react';

import { cn } from '../../lib/utils';

export type StatusBadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'outline';

const statusBadgeVariants: Record<StatusBadgeVariant, string> = {
  default: 'bg-primary/12 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive/14 text-destructive',
  success: 'bg-success/14 text-success',
  warning: 'bg-warning/18 text-warning-foreground',
  info: 'bg-info/14 text-info',
  outline: 'bg-background text-foreground border border-border',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
}

function StatusBadge({ className, variant = 'default', ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors',
        statusBadgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { StatusBadge, statusBadgeVariants };
