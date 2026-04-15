import { cn } from '../lib/cn';

/** Props for the {@link Textarea} component. */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** A styled textarea component. Uses 16px font to prevent iOS zoom. */
function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
