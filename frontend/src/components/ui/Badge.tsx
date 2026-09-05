import React from 'react';

export type BadgeVariant = 'positive' | 'neutral' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  status?: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  showDot = true,
  children,
  className = '',
}) => {
  let effectiveVariant: BadgeVariant = variant || 'neutral';
  
  if (!variant && status) {
    const s = status.toLowerCase();
    if (['active', 'approved', 'paid', 'present', 'running', 'done', 'success'].includes(s)) {
      effectiveVariant = 'positive';
    } else if (['pending', 'to approve', 'to_approve', 'warning', 'unsent'].includes(s)) {
      effectiveVariant = 'warning';
    } else if (['draft'].includes(s)) {
      effectiveVariant = 'neutral';
    } else if (['absent', 'refused', 'expired', 'overdue', 'duplicate', 'failed', 'terminated'].includes(s)) {
      effectiveVariant = 'danger';
    } else if (['viewed', 'validated', 'info'].includes(s)) {
      effectiveVariant = 'info';
    }
  }

  let styleClasses = '';
  let dotColorClass = '';

  switch (effectiveVariant) {
    case 'positive':
      styleClasses = 'bg-[#DCFCE7] text-[#16A34A] border border-emerald-200';
      dotColorClass = 'bg-[#16A34A]';
      break;
    case 'neutral':
      styleClasses = 'bg-[#F1F5F9] text-[#64748B] border border-slate-200';
      dotColorClass = 'bg-[#64748B]';
      break;
    case 'warning':
      styleClasses = 'bg-[#FEF3C7] text-[#D97706] border border-amber-200';
      dotColorClass = 'bg-[#D97706]';
      break;
    case 'danger':
      styleClasses = 'bg-[#FEE2E2] text-[#DC2626] border border-red-200';
      dotColorClass = 'bg-[#DC2626]';
      break;
    case 'info':
      styleClasses = 'bg-[#DBEAFE] text-[#2563EB] border border-blue-200';
      dotColorClass = 'bg-[#2563EB]';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleClasses} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />}
      {children || status}
    </span>
  );
};
