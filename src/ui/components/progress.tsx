import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../lib/cn';

// Indicator animates via width (300 ms ease) rather than translateX — the
// design's `.progress-bar { transition: width 0.3s }` is the canonical
// motion. translateX would still work but would extend off the right edge
// of the track when the indicator's intrinsic width was 100%.
function Progress({
  className,
  value,
  ...props
}: React.ComponentPropsWithRef<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-accent transition-[width] duration-300 ease-out"
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
