import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

// Dot pulses via the box-shadow halo (`animate-dot-pulse`) — registered in
// theme.css as `dot-pulse` keyframes that ramp `--accent-glow` from 0 to 5 px
// spread and back. The previous `animate-pulse` (Tailwind opacity-fade) was
// the wrong motion shape and the wrong colour (faded the dot itself).
const dotVariants = cva('h-1.5 w-1.5 rounded-full motion-safe:animate-dot-pulse', {
  variants: {
    status: {
      default: 'bg-accent',
      active: 'bg-accent',
      paused: 'bg-warm',
    },
  },
  defaultVariants: {
    status: 'default',
  },
});

/** Props for the {@link SessionPill} component. */
export interface SessionPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof dotVariants> {}

/**
 * A rounded mono-font pill used to surface a session / accent / mode indicator
 * in the site header. Renders a pulsing coloured dot followed by the children
 * as free-form label content.
 *
 * Surface is transparent (the design's `.session-pill` paints only its border)
 * and the pill slides in from the right on mount via `animate-pill-in`
 * (480 ms, 240 ms delay) — both registered as keyframes in theme.css.
 *
 * @example
 * ```tsx
 * <SessionPill>
 *   <span>teal / dark</span>
 * </SessionPill>
 *
 * <SessionPill status="paused">
 *   <span>draft</span>
 * </SessionPill>
 * ```
 */
function SessionPill({ className, status, children, ...props }: SessionPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-2.5 py-1 font-mono text-[0.72rem] uppercase tracking-widest text-text-dim whitespace-nowrap motion-safe:animate-pill-in',
        className,
      )}
      {...props}
    >
      <span data-status={status ?? 'default'} className={cn(dotVariants({ status }))} aria-hidden />
      {children}
    </span>
  );
}

export { SessionPill };
