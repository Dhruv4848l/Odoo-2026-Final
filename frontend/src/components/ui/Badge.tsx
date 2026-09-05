import React from 'react';

export type BadgeVariant = 'positive' | 'neutral' | 'warning' | 'danger' | 'info' | 'violet';

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
    if (['active', 'approved', 'paid', 'present', 'running', 'done', 'success', 'cleared'].includes(s)) {
      effectiveVariant = 'positive';
    } else if (['pending', 'to approve', 'to_approve', 'warning', 'unsent', 'in review', 'draft'].includes(s)) {
      effectiveVariant = 'warning';
    } else if (['absent', 'refused', 'expired', 'overdue', 'duplicate', 'failed', 'terminated', 'missing'].includes(s)) {
      effectiveVariant = 'danger';
    } else if (['computed', 'active selection', 'in progress'].includes(s)) {
      effectiveVariant = 'violet';
    } else if (['viewed', 'validated', 'info'].includes(s)) {
      effectiveVariant = 'info';
    }
  }

  let styleClasses = '';
  let dotColorClass = '';

  switch (effectiveVariant) {
    case 'positive':
      styleClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      dotColorClass = 'bg-[#10B981]';
      break;
    case 'neutral':
      styleClasses = 'bg-[#F2F3F8] text-[#5A5D72] border border-[#E2E8F0]';
      dotColorClass = 'bg-[#94A3B8]';
      break;
    case 'warning':
      styleClasses = 'bg-amber-50 text-amber-700 border border-amber-200/80';
      dotColorClass = 'bg-[#F59E0B]';
      break;
    case 'danger':
      styleClasses = 'bg-red-50 text-red-700 border border-red-200/80';
      dotColorClass = 'bg-[#EF4444]';
      break;
    case 'violet':
      styleClasses = 'bg-[#E1E0FF] text-[#4044CE] border border-[#C0C1FF]';
      dotColorClass = 'bg-[#5A5FE8]';
      break;
    case 'info':
      styleClasses = 'bg-cyan-50 text-cyan-700 border border-cyan-200/80';
      dotColorClass = 'bg-[#06B6D4]';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold tracking-tight shadow-sm ${styleClasses} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />}
      {children || status}
    </span>
  );
};
