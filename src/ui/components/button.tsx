import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Button styling ramp aligned with the rs. design-system button scale.
 *
 * - `brand` is the attention-grabbing call-to-action: bright brand fill with
 *   `--primary-foreground` text. Use sparingly (one per view).
 * - `primary` is the default: the tinted `--primary` surface with the same
 *   brand-derived text colour. Pairs with the brand accent without shouting.
 * - `secondary` is a quieter bordered action that lifts on hover to `--card-2`.
 * - `ghost` drops the border entirely until hover.
 * - `destructive` stays red for irreversible actions.
 *
 * The focus ring is a single 3 px `--ring` outline plus a `--brand-glow` halo,
 * shared across all variants so the affordance stays consistent as the accent
 * rotates.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:shadow-[0_0_0_6px_var(--brand-glow)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'border border-transparent bg-brand text-primary-foreground hover:bg-brand/90',
        primary:
          'border border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border border-border bg-transparent text-foreground hover:bg-card-2',
        ghost: 'border border-transparent bg-transparent text-foreground hover:bg-card-2',
        destructive:
          'border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        // 36 px compact — dense toolbars and inline actions.
        sm: 'h-9 rounded-md px-3 text-xs',
        // 42 px default — the workhorse form-control height.
        default: 'h-[2.625rem] px-4 py-2',
        // 48 px emphasis — hero CTAs and single primary actions.
        lg: 'h-12 rounded-md px-8 text-base',
        // Square icon button — matches the default height for alignment.
        icon: 'h-[2.625rem] w-[2.625rem]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

/** Props for the {@link Button} component. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders the child element directly instead of wrapping in a `<button>`. */
  asChild?: boolean;
}

/**
 * A button component with five visual variants and four sizes.
 * Variant scale: `brand` · `primary` (default) · `secondary` · `ghost` · `destructive`.
 */
function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
