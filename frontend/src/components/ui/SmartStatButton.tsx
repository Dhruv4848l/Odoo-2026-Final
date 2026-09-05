import React from 'react';

interface SmartStatButtonProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  onClick?: () => void;
}

export const SmartStatButton: React.FC<SmartStatButtonProps> = ({
  icon,
  value,
  label,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-center gap-3 px-4 py-2 bg-white border border-border rounded-md hover:bg-gray-50 transition-all text-left shadow-xs group"
    >
      {icon && <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-ink leading-none">{value}</span>
        <span className="text-[11px] font-medium text-slate mt-0.5">{label}</span>
      </div>
    </button>
  );
};
