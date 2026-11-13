import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-mocha text-white hover:bg-dark shadow-soft',
        secondary: 'bg-sand text-dark hover:bg-taupe/40 border border-taupe/30',
        outline: 'border border-mocha/30 bg-transparent text-dark hover:bg-sand/50',
        ghost: 'text-mocha hover:bg-sand/60',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = 'Button';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-sand bg-white text-dark shadow-card transition-shadow',
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-md border border-taupe/50 bg-white px-3.5 py-2 text-sm text-dark placeholder:text-mocha/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full rounded-md border border-taupe/50 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-mocha/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha',
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = 'sand',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'sand' | 'mocha' | 'outline' }) {
  const styles =
    variant === 'mocha'
      ? 'bg-mocha text-white'
      : variant === 'outline'
        ? 'border border-taupe/60 text-mocha bg-transparent'
        : 'bg-sand text-mocha';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
        styles,
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-taupe/60 bg-ivory/60 px-6 py-12 text-center">
      <p className="font-serif text-xl text-dark">{title}</p>
      {description ? <p className="mt-2 text-sm text-mocha/80">{description}</p> : null}
    </div>
  );
}
