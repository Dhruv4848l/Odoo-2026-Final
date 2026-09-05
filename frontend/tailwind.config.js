/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FE9', // Indigo-600
          dark: '#3F35A8',    // Indigo-800
          light: '#EEF0FF',   // Indigo-50
        },
        indigo: {
          50: '#EEF0FF',
          600: '#5B4FE9',
          800: '#3F35A8',
        },
        navy: {
          DEFAULT: '#14141F', // Ink Navy Dark Surface
          900: '#14141F',
        },
        canvas: '#F6F6FB',    // Page Background
        ink: '#1A1A2E',       // Text Primary
        slate: '#6B7280',     // Text Secondary
        mist: '#9CA3AF',      // Text Muted
        border: '#E5E7EB',
        success: {
          DEFAULT: '#22C55E',
          tint: '#DCFCE7',
          text: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E0B',
          tint: '#FEF3C7',
          text: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          tint: '#FEE2E2',
          text: '#DC2626',
        },
        info: {
          DEFAULT: '#3B82F6',
          tint: '#DBEAFE',
          text: '#2563EB',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(16, 24, 40, 0.06)',
        'md': '0 4px 10px rgba(16, 24, 40, 0.10)',
        'lg': '0 10px 30px rgba(16, 24, 40, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'Calibri', 'system-ui', 'sans-serif'],
        mono: ['Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
