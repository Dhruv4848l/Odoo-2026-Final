import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'navy' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs rounded-full',
    md: 'h-10 px-5 text-sm rounded-full',
    lg: 'h-12 px-7 text-base rounded-full',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    navy: 'bg-navy text-white hover:bg-navy/90 shadow-sm',
    secondary: 'bg-white text-ink border border-border hover:bg-canvas rounded-md',
    success: 'bg-success text-white hover:bg-success-text shadow-sm',
    danger: 'bg-transparent text-danger-text border border-danger hover:bg-danger-tint',
    ghost: 'bg-transparent text-slate hover:bg-gray-100 rounded-md',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
