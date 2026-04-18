import type { ReactNode } from 'react';

export const EmptyState = ({ title, description, action }: { title: string; description: string; action?: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
