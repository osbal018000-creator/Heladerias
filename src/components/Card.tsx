import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl border border-cream-200 shadow-soft p-4 ${className}`}
    >
      {children}
    </div>
  );
}
