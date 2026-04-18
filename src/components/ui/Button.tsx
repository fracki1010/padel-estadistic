import clsx from 'clsx';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger'
  }[variant];

  return (
    <button className={clsx('btn', variantClass, className)} disabled={disabled || loading} {...props}>
      {loading ? 'Guardando...' : children}
    </button>
  );
};
