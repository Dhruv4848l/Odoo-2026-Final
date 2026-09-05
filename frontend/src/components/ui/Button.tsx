import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'navy' | 'finalize' | 'secondary' | 'success' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  let baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#5A5FE8]/40 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[#5A5FE8] text-white hover:bg-[#4C51DE] shadow-[0_4px_16px_-2px_rgba(90,95,232,0.40)] hover:shadow-[0_6px_22px_-2px_rgba(90,95,232,0.55)]';
      break;
    case 'navy':
    case 'finalize':
      variantStyles = 'bg-[#12141F] text-white hover:bg-[#1B1E30] border border-white/10 shadow-sm hover:shadow-md';
      break;
    case 'secondary':
      variantStyles = 'bg-white border border-[#E2E8F0] text-[#191C1F] hover:bg-[#F8F9FE] hover:border-slate-300 shadow-sm';
      break;
    case 'success':
      variantStyles = 'bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_14px_-2px_rgba(16,185,129,0.35)]';
      break;
    case 'danger':
      variantStyles = 'bg-white border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] shadow-sm';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-[#5A5D72] hover:bg-[#EDEEF3] hover:text-[#191C1F]';
      break;
    case 'icon':
      variantStyles = 'bg-white border border-[#E2E8F0] text-[#5A5D72] hover:text-[#5A5FE8] hover:bg-[#F8F9FE] shadow-sm p-2';
      break;
  }

  let sizeStyles = '';
  if (variant === 'icon') {
    sizeStyles = 'w-9 h-9';
  } else {
    switch (size) {
      case 'sm':
        sizeStyles = 'h-[32px] px-3.5 text-xs';
        break;
      case 'md':
        sizeStyles = 'h-[40px] px-5 text-sm';
        break;
      case 'lg':
        sizeStyles = 'h-[46px] px-7 text-base';
        break;
    }
  }

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export interface SmartStatButtonProps {
  label: string;
  count: number | string;
  onClick?: () => void;
}

export const SmartStatButton: React.FC<SmartStatButtonProps> = ({ label, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex flex-col items-center justify-center px-4 py-2 bg-white border border-[#E5E7EB] rounded-md hover:bg-slate-50 transition-colors shadow-sm min-w-[90px]"
    >
      <span className="text-sm font-bold text-[#1A1A2E]">{count}</span>
      <span className="text-[11px] font-medium text-[#6B7280]">{label}</span>
    </button>
  );
};
