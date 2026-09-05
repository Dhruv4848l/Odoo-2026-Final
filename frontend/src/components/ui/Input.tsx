import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isComputed?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  isComputed = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  let inputStyles = 'w-full h-10 px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none';

  if (isComputed) {
    inputStyles += ' bg-[#F3F4F6] border-[#E5E7EB] text-[#1A1A2E] font-mono cursor-not-allowed';
  } else if (error) {
    inputStyles += ' bg-white border-[#EF4444] text-[#1A1A2E] focus:ring-2 focus:ring-[#EF4444]/20';
  } else {
    inputStyles += ' bg-white border-[#E5E7EB] text-[#1A1A2E] focus:border-[#5B4FE9] focus:ring-2 focus:ring-[#5B4FE9]/15';
  }

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#6B7280]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        readOnly={isComputed}
        className={`${inputStyles} ${className}`}
        {...props}
      />
      {isComputed && <span className="text-[10px] text-[#9CA3AF] italic">Auto-calculated field</span>}
      {error && <span className="text-xs text-[#EF4444] font-medium">{error}</span>}
      {!error && helperText && <span className="text-xs text-[#6B7280]">{helperText}</span>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string | number; label: string }>;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#6B7280]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3 py-2 text-sm bg-white rounded-md border border-[#E5E7EB] text-[#1A1A2E] focus:border-[#5B4FE9] focus:ring-2 focus:ring-[#5B4FE9]/15 focus:outline-none transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[#EF4444] font-medium">{error}</span>}
    </div>
  );
};
