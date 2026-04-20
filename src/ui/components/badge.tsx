import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Badge ramp aligned with the rs. design-system `.badge` styles.
 *
 * - `default` is the neutral pill (card-2 surface, muted text) — used for
 *   passive status labels.
 * - `solid` / `subtle` / `outline` are the brand-tinted variants.
 * - `warm` is the single secondary hue used for "heads up" states.
 * - `destructive` keeps the red transparent pill.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[0.75rem] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-card-2 text-foreground border-border',
        solid: 'bg-brand text-primary-foreground border-transparent',
        subtle: 'bg-primary text-primary-foreground border-transparent',
        outline: 'bg-transparent text-foreground border-border',
        warm: 'bg-warm-dim text-warm border-transparent',
        destructive: 'bg-destructive text-destructive-foreground border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/** Props for the {@link Badge} component. */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/** A small status indicator badge. */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
