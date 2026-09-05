import React from 'react';

export interface CardProps {
  variant?: 'standard' | 'kpi' | 'gradient' | 'kanban' | 'modal' | 'deck';
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  title,
  subtitle,
  children,
  className = '',
  onClick,
  headerAction,
}) => {
  let cardStyle = '';

  switch (variant) {
    case 'standard':
      cardStyle = 'bg-white rounded-[24px] p-6 border border-[#E2E8F0] shadow-fintech hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300';
      break;
    case 'kpi':
      cardStyle = 'bg-white rounded-[24px] p-6 shadow-fintech border border-[#E2E8F0]/80 hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300';
      break;
    case 'gradient':
      cardStyle = 'bg-gradient-to-r from-[#5A5FE8] via-[#4E52DD] to-[#4044CE] text-white rounded-[24px] p-6 shadow-glow hover:shadow-glow-hover hover:-translate-y-1 transition-all duration-300';
      break;
    case 'kanban':
      cardStyle = 'bg-white rounded-[20px] p-5 shadow-fintech border border-[#E2E8F0] hover:shadow-fintech-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer';
      break;
    case 'modal':
      cardStyle = 'bg-white rounded-[28px] p-7 shadow-2xl border border-[#E2E8F0] max-w-2xl w-full';
      break;
    case 'deck':
      cardStyle = 'bg-[#12141F] text-white rounded-[32px] p-7 border border-white/5 shadow-deck hover:shadow-[0_24px_48px_-8px_rgba(18,20,31,0.6)] transition-all duration-300';
      break;
  }

  return (
    <div onClick={onClick} className={`${cardStyle} ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E7EB]/60">
          <div>
            {title && (
              <h3 className={`text-base font-semibold ${variant === 'gradient' ? 'text-white' : 'text-[#1A1A2E]'}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-xs ${variant === 'gradient' ? 'text-indigo-100' : 'text-[#6B7280]'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
