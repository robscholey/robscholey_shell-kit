import { cn } from '../lib/cn';

/** Props for the {@link Input} component. */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** A styled text input component. Touch target meets 44px minimum. Uses 16px font to prevent iOS zoom. */
function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
