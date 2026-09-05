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
  let baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[#5B4FE9] text-white rounded-full hover:bg-[#3F35A8] shadow-sm';
      break;
    case 'navy':
    case 'finalize':
      variantStyles = 'bg-[#14141F] text-white rounded-full hover:bg-slate-800 shadow-sm';
      break;
    case 'secondary':
      variantStyles = 'bg-white border border-[#E5E7EB] text-[#1A1A2E] rounded-md hover:bg-slate-50 shadow-sm';
      break;
    case 'success':
      variantStyles = 'bg-[#22C55E] text-white rounded-full hover:bg-emerald-600 shadow-sm';
      break;
    case 'danger':
      variantStyles = 'bg-white border border-[#EF4444] text-[#EF4444] rounded-full hover:bg-[#FEE2E2] shadow-sm';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-[#6B7280] rounded-md hover:bg-slate-100 hover:text-[#1A1A2E]';
      break;
    case 'icon':
      variantStyles = 'bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 p-2';
      break;
  }

  let sizeStyles = '';
  if (variant === 'icon') {
    sizeStyles = 'w-9 h-9';
  } else {
    switch (size) {
      case 'sm':
        sizeStyles = 'h-[30px] px-3 text-xs';
        break;
      case 'md':
        sizeStyles = 'h-[38px] px-4 text-sm';
        break;
      case 'lg':
        sizeStyles = 'h-[44px] px-6 text-base';
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
