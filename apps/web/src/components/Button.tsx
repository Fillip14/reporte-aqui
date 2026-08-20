import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
