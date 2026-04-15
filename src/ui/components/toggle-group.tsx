import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { toggleVariants } from './toggle';

/** A group of toggle buttons where one or more can be active. */
function ToggleGroup({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    />
  );
}

/** A single toggle button within a toggle group. */
function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentPropsWithRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
