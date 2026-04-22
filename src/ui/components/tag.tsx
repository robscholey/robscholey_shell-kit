import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Tag styling — a monospace chip used for tech labels on project cards.
 *
 * Aligned to design `.tag`: lowercase mono on a transparent surface with a
 * 1 px border. `accent` tints text + border in `--accent`; `warm` tints in
 * `--warm` for secondary callouts.
 */
const tagVariants = cva(
  'inline-flex items-center rounded-[4px] font-mono text-[0.72rem] lowercase px-2 py-0.5 whitespace-nowrap border bg-transparent',
  {
    variants: {
      variant: {
        default: 'text-text-muted border-border',
        accent: 'text-accent border-accent-dim',
        warm: 'text-warm border-warm-dim',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/** Props for the {@link Tag} component. */
export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

/**
 * A small monospace tech-label chip. Renders as a `<span>`.
 *
 * @example
 * ```tsx
 * <Tag>ts</Tag>
 * <Tag variant="accent">react</Tag>
 * <Tag variant="warm">wip</Tag>
 * ```
 */
function Tag({ className, variant, ...props }: TagProps) {
  return <span className={cn(tagVariants({ variant }), className)} {...props} />;
}

export { Tag, tagVariants };
