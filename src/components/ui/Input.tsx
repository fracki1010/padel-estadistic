import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => {
  return (
    <div>
      {label ? <label className="label">{label}</label> : null}
      <input ref={ref} className={clsx('input', className)} {...props} />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});

Input.displayName = 'Input';
