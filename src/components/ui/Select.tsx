import clsx from 'clsx';
import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div>
        {label ? <label className="label">{label}</label> : null}
        <select ref={ref} className={clsx('input', className)} {...props}>
          {children}
        </select>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
