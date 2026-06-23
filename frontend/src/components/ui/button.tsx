import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:     'bg-primary text-background hover:bg-primary/85 border border-transparent',
        secondary:   'bg-bg-3 text-text-2 border border-border-mid hover:bg-bg-4 hover:text-text-1',
        ghost:       'bg-transparent text-text-3 border border-border hover:bg-bg-3 hover:text-text-1',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 hover:border-destructive/60',
        success:     'bg-green/10 text-green-light border border-[var(--green-border)] hover:bg-green/20',
        warning:     'bg-amber/10 text-amber border border-[var(--amber-border)] hover:bg-amber/20',
        link:        'text-primary underline-offset-4 hover:underline border-0',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 px-3 py-1.5 text-xs',
        lg:      'h-10 px-5',
        icon:    'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };