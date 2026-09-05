import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'glass';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  showSubtitle = false,
  subtitleText = 'HR & Payroll Operations',
  className = '',
  onClick,
}) => {
  // Dimensions based on size
  const dimensions = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 44, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 52, text: 'text-3xl', sub: 'text-sm' },
  }[size];

  const textColor = variant === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const subColor = variant === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* 360° Dynamic Vector Mark */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: dimensions.icon, height: dimensions.icon }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(90,95,232,0.28)]"
        >
          <defs>
            {/* Main Indigo Gradient */}
            <linearGradient id="pp360_grad_main" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4044CE" />
              <stop offset="50%" stopColor="#5A5FE8" />
              <stop offset="100%" stopColor="#7B80FF" />
            </linearGradient>

            {/* Cyan Dynamic Accent Gradient */}
            <linearGradient id="pp360_grad_accent" x1="42" y1="6" x2="10" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Soft Ambient Inner Glow */}
            <radialGradient id="pp360_center_glow" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5A5FE8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#5A5FE8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Rounded Shield / Tile */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill={variant === 'dark' ? '#181B2B' : '#F1F3FF'}
            stroke={variant === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(90,95,232,0.14)'}
            strokeWidth="1.2"
          />

          {/* Center Glow */}
          <circle cx="24" cy="24" r="12" fill="url(#pp360_center_glow)" />

          {/* 360-Degree Continuous Circulating Arc 1 (Lower-Left to Top-Right Loop) */}
          <path
            d="M13 24C13 17.9249 17.9249 13 24 13C29.2 13 33.56 16.59 34.72 21.4C34.88 22.06 34.33 22.67 33.65 22.67C33.05 22.67 32.55 22.23 32.41 21.64C31.42 17.65 27.81 14.67 23.5 14.67C18.34 14.67 14.17 18.84 14.17 24C14.17 29.16 18.34 33.33 23.5 33.33C27.24 33.33 30.46 31.13 31.94 27.97C32.22 27.38 32.9 27.13 33.48 27.4C34.07 27.67 34.32 28.36 34.04 28.94C32.24 32.8 28.32 35.5 23.5 35.5C17.15 35.5 12 30.35 12 24H13Z"
            fill="url(#pp360_grad_main)"
          />

          {/* 360-Degree Continuous Circulating Arc 2 (Upper-Right Return Loop & Arrow Head) */}
          <path
            d="M35 24C35 30.0751 30.0751 35 24 35C21.6 35 19.38 34.22 17.58 32.9C17.04 32.5 16.95 31.74 17.37 31.23C17.78 30.71 18.54 30.63 19.06 31.02C20.5 32.07 22.28 32.67 24.17 32.67C28.95 32.67 32.83 28.79 32.83 24C32.83 19.21 28.95 15.33 24.17 15.33C21.8 15.33 19.67 16.28 18.11 17.82L19.88 19.6C20.37 20.08 20.03 20.92 19.35 20.92H14.5C13.95 20.92 13.5 20.47 13.5 19.92V15.07C13.5 14.39 14.34 14.05 14.82 14.54L16.48 16.2C18.42 14.31 21.08 13.15 24 13.15C30.08 13.15 35 18.07 35 24Z"
            fill="url(#pp360_grad_accent)"
          />

          {/* Central Precision Core / Diamond Spark */}
          <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
          <circle cx="24" cy="24" r="2" fill="#5A5FE8" />
        </svg>
      </div>

      {/* Typography: PeoplePay with dynamic graphic 360 orbit accent */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 leading-none">
          <span className={`font-black tracking-tight ${dimensions.text} ${textColor}`}>
            People<span className="text-[#5A5FE8]">Pay</span>
          </span>

          {/* Sleek 360° Graphical Orbit Badge */}
          <span className="inline-flex items-center justify-center ml-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#5A5FE8]/10 to-[#06B6D4]/10 border border-[#5A5FE8]/20 text-[10px] font-extrabold tracking-wider font-mono text-[#5A5FE8] shadow-xs">
            360<span className="text-[8px] text-[#06B6D4] -mt-1 font-bold">°</span>
          </span>
        </div>

        {showSubtitle && (
          <span className={`${dimensions.sub} ${subColor} font-medium tracking-normal mt-0.5`}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
