import type { ReactNode } from 'react';

export default function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}
