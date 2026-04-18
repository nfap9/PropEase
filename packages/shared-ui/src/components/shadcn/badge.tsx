import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/12 text-primary shadow-sm hover:bg-primary/18',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
        destructive: 'border-transparent bg-destructive/14 text-destructive shadow-sm hover:bg-destructive/18',
        success: 'border-transparent bg-success/14 text-success shadow-sm hover:bg-success/18',
        warning: 'border-transparent bg-warning/18 text-warning-foreground shadow-sm hover:bg-warning/24',
        info: 'border-transparent bg-info/14 text-info shadow-sm hover:bg-info/18',
        outline: 'border-border bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
