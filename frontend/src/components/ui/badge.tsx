import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        default:       'bg-bg-3 text-text-2 border-border',
        alive:         'bg-green/10 text-green-light border-[var(--green-border)]',
        dead:          'bg-red/10 text-red border-red/30',
        disqualified:  'bg-amber/10 text-amber border-[var(--amber-border)]',
        pending:       'bg-blue-dim text-blue-light border-[var(--blue-border)]',
        approved:      'bg-green/10 text-green-light border-[var(--green-border)]',
        rejected:      'bg-red/10 text-red border-red/30',
        blocked:       'bg-amber/10 text-amber border-[var(--amber-border)]',
        deleted:       'bg-bg-3 text-text-3 border-border',
        master:        'bg-gold/15 text-gold border-gold/40',
        moderator:     'bg-bg-3 text-text-2 border-border-mid',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };