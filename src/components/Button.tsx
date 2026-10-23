import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-strawberry-600 hover:bg-strawberry-700 text-white shadow-warm disabled:bg-strawberry-300',
  secondary:
    'bg-white hover:bg-cream-100 text-choco-600 border border-cream-300 disabled:opacity-50 shadow-soft',
  danger:
    'bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:bg-red-300',
  ghost: 'bg-transparent hover:bg-cream-100 text-choco-400 hover:text-choco-600',
  success:
    'bg-pistachio-500 hover:bg-pistachio-600 text-white shadow-soft disabled:bg-pistachio-300',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-2xl gap-2 font-bold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
