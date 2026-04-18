import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

export const Badge = ({ children, color = 'slate' }: PropsWithChildren<{ color?: 'slate' | 'green' | 'yellow' | 'red' | 'blue' }>) => {
  const colorClass = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-700'
  }[color];

  return <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', colorClass)}>{children}</span>;
};
