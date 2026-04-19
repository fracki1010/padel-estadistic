import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

export const Badge = ({ children, color = 'slate' }: PropsWithChildren<{ color?: 'slate' | 'green' | 'yellow' | 'red' | 'blue' }>) => {
  const colorClass = {
    slate: 'border border-slate-700 bg-slate-800 text-slate-200',
    green: 'border border-emerald-700 bg-emerald-950 text-emerald-300',
    yellow: 'border border-amber-700 bg-amber-950 text-amber-300',
    red: 'border border-red-700 bg-red-950 text-red-300',
    blue: 'border border-sky-700 bg-sky-950 text-sky-300'
  }[color];

  return <span className={clsx('rounded-full px-2.5 py-1 text-sm font-medium', colorClass)}>{children}</span>;
};
