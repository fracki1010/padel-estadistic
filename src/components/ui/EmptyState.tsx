import type { ReactNode } from 'react';

export const EmptyState = ({ title, description, action }: { title: string; description: string; action?: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center">
    <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
    <p className="mt-2 text-sm text-slate-400">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
