import React from 'react';

export interface CardProps {
  variant?: 'standard' | 'kpi' | 'gradient' | 'kanban' | 'modal';
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
      cardStyle = 'bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-sm';
      break;
    case 'kpi':
      cardStyle = 'bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]';
      break;
    case 'gradient':
      cardStyle = 'bg-gradient-to-r from-[#5B4FE9] to-[#3F35A8] text-white rounded-xl p-6 shadow-md';
      break;
    case 'kanban':
      cardStyle = 'bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer';
      break;
    case 'modal':
      cardStyle = 'bg-white rounded-xl p-6 shadow-lg border border-[#E5E7EB] max-w-2xl w-full';
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
