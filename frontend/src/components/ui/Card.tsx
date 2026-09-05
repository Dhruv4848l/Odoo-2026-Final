import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  variant?: 'standard' | 'kpi' | 'gradient' | 'modal';
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  className,
  onClick,
  children,
}) => {
  const baseStyles = 'transition-all duration-150';

  const variantStyles = {
    standard: 'bg-white rounded-lg border border-border p-5 shadow-sm hover:shadow-md',
    kpi: 'bg-white rounded-xl p-6 shadow-sm border border-border/50',
    gradient: 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-6 shadow-md',
    modal: 'bg-white rounded-xl p-6 shadow-lg border border-border max-w-md w-full',
  };

  return (
    <div onClick={onClick} className={clsx(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  );
};
