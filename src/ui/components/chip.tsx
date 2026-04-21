import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Props for the {@link Chip} component. */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** When true, the chip renders with the active accent-tinted treatment. */
  active?: boolean;
  /**
   * Optional numeric count rendered as a subtle-foreground suffix after the
   * label. When the chip is active, the count inherits the accent colour.
   */
  count?: number;
  /** Label — typically a short mono filter name. */
  children: ReactNode;
}

/**
 * A filter / tab-row chip. Renders as a `<button>` by default so keyboard
 * interaction and click handlers work with no wrapping. The chip sits on
 * `--card` with a subtle border; active state tints the background and
 * border in `--brand` while the label shifts to `--brand`.
 *
 * Distinct from `<Tag>` (tech label, uppercase, tracking) and `<Badge>`
 * (inline label, no interaction). Chips carry state and are tappable.
 *
 * @example
 * ```tsx
 * <Chip active count={14}>codes</Chip>
 * <Chip count={11}>users</Chip>
 * <Chip>sessions</Chip>
 * ```
 *
 * @param props - The chip props; forwarded to the underlying `<button>`.
 * @returns A rounded-full interactive button styled for filter rows.
 */
function Chip({
  className,
  active = false,
  count,
  children,
  type = 'button',
  ...props
}: ChipProps): ReactElement {
  return (
    <button
      type={type}
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-[11px] py-[5px] font-mono text-[0.72rem] text-muted-foreground transition-[color,background-color,border-color] duration-150 hover:border-brand-dim hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active &&
          'border-[color-mix(in_srgb,var(--brand)_35%,var(--border))] bg-[color-mix(in_srgb,var(--brand)_10%,var(--card-2))] text-brand hover:text-brand',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'text-[0.68rem]',
            active ? 'text-brand opacity-75' : 'text-subtle-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export { Chip };
