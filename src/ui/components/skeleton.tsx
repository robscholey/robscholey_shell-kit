import { cn } from '../lib/cn';

// Sits on the neutral lifted surface tier (`--surface-2`) so it stays
// visible across every accent — `bg-accent-deep/10` was the previous base
// but rendered near-invisible against `--bg` in dark/teal.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} {...props} />;
}

export { Skeleton };
