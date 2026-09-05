import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  status: 'active' | 'running' | 'approved' | 'paid' | 'present' | 'draft' | 'inactive' | 'pending' | 'to_approve' | 'warning' | 'absent' | 'refused' | 'expired' | 'terminated' | 'info';
  children?: React.ReactNode;
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, children, showDot = true }) => {
  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: 'bg-success-tint', text: 'text-success-text', dot: 'bg-success', label: 'Active' },
    running: { bg: 'bg-success-tint', text: 'text-success-text', dot: 'bg-success', label: 'Running' },
    approved: { bg: 'bg-success-tint', text: 'text-success-text', dot: 'bg-success', label: 'Approved' },
    paid: { bg: 'bg-success-tint', text: 'text-success-text', dot: 'bg-success', label: 'Paid' },
    present: { bg: 'bg-success-tint', text: 'text-success-text', dot: 'bg-success', label: 'Present' },
    draft: { bg: 'bg-gray-100', text: 'text-slate', dot: 'bg-slate', label: 'Draft' },
    inactive: { bg: 'bg-gray-100', text: 'text-slate', dot: 'bg-slate', label: 'Inactive' },
    pending: { bg: 'bg-warning-tint', text: 'text-warning-text', dot: 'bg-warning', label: 'Pending' },
    to_approve: { bg: 'bg-warning-tint', text: 'text-warning-text', dot: 'bg-warning', label: 'To Approve' },
    warning: { bg: 'bg-warning-tint', text: 'text-warning-text', dot: 'bg-warning', label: 'Warning' },
    absent: { bg: 'bg-danger-tint', text: 'text-danger-text', dot: 'bg-danger', label: 'Absent' },
    refused: { bg: 'bg-danger-tint', text: 'text-danger-text', dot: 'bg-danger', label: 'Refused' },
    expired: { bg: 'bg-danger-tint', text: 'text-danger-text', dot: 'bg-danger', label: 'Expired' },
    terminated: { bg: 'bg-danger-tint', text: 'text-danger-text', dot: 'bg-danger', label: 'Terminated' },
    info: { bg: 'bg-info-tint', text: 'text-info-text', dot: 'bg-info', label: 'Info' },
  };

  const config = styles[status] || styles.draft;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full',
        config.bg,
        config.text
      )}
    >
      {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {children || config.label}
    </span>
  );
};
