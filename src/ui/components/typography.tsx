import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-3xl font-bold tracking-tight sm:text-5xl',
      h2: 'text-2xl font-bold tracking-tight sm:text-4xl',
      h3: 'text-xl font-semibold tracking-tight sm:text-2xl',
      h4: 'text-lg font-semibold sm:text-xl',
      subtitle: 'text-lg text-muted-foreground sm:text-xl',
      body: 'text-base leading-relaxed',
      muted: 'text-base text-muted-foreground leading-relaxed',
      small: 'text-sm text-muted-foreground',
      label: 'text-sm font-medium leading-none',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'body',
    align: 'left',
  },
});

/** HTML element names that Typography can render as. */
type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';

const defaultElements: Record<
  NonNullable<VariantProps<typeof typographyVariants>['variant']>,
  TypographyElement
> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  subtitle: 'p',
  body: 'p',
  muted: 'p',
  small: 'p',
  label: 'span',
};

/** Props for the {@link Typography} component. */
export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  /** Override the default HTML element for this variant. */
  as?: TypographyElement;
}

/**
 * A typography component with responsive, mobile-first sizing.
 * Renders the appropriate HTML element based on the variant (h1→`<h1>`, body→`<p>`, etc.).
 * Override with the `as` prop when semantics differ from visuals.
 *
 * @example
 * ```tsx
 * <Typography variant="h1">Rob Scholey</Typography>
 * <Typography variant="subtitle" align="center">Software Engineer</Typography>
 * <Typography variant="muted">Some description text</Typography>
 * <Typography variant="h2" as="p">Looks like h2, renders as p</Typography>
 * ```
 */
export function Typography({ variant, align, as, className, ...props }: TypographyProps) {
  const Component = as ?? defaultElements[variant ?? 'body'];
  return <Component className={cn(typographyVariants({ variant, align }), className)} {...props} />;
}

export { typographyVariants };
