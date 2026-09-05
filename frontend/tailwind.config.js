/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#EEF0FF',
          600: '#5B4FE9',
          800: '#3F35A8',
        },
        navy: {
          900: '#14141F',
        },
        canvas: '#F6F6FB',
        ink: '#1A1A2E',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(16,24,40,.06)',
        'md': '0 4px 10px rgba(16,24,40,.10)',
        'lg': '0 10px 30px rgba(16,24,40,.18)',
      }
    },
  },
  plugins: [],
}
