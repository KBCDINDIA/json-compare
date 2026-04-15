/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFDF7',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#2563EB',
          soft: '#DBEAFE',
        },
        accent: {
          DEFAULT: '#FCD34D',
          soft: '#FEF3C7',
        },
        ink: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
        },
        edge: '#E2E8F0',
        sev: {
          addBg: '#DCFCE7',
          addFg: '#15803D',
          remBg: '#FEE2E2',
          remFg: '#B91C1C',
          chgBg: '#FEF3C7',
          chgFg: '#92400E',
          typBg: '#FFEDD5',
          typFg: '#C2410C',
          movBg: '#DBEAFE',
          movFg: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
