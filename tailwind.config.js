/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf4',
          100: '#d6f7e3',
          200: '#b0edcb',
          300: '#7ddcac',
          400: '#46c488',
          500: '#22a86d',
          600: '#158758',
          700: '#136c48',
          800: '#13563b',
          900: '#114732',
          950: '#06281c',
        },
        ink: {
          50: '#f5f7f8',
          100: '#e9edf0',
          200: '#cdd6dc',
          300: '#a3b3bd',
          400: '#71899a',
          500: '#556e80',
          600: '#48596b',
          700: '#3d4a59',
          800: '#25303d',
          900: '#161d26',
          950: '#0b0f14',
        },
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 32, 0.04), 0 8px 24px -8px rgba(15, 23, 32, 0.12)',
        'card-hover': '0 2px 4px rgba(15, 23, 32, 0.06), 0 16px 40px -12px rgba(15, 23, 32, 0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: 0.8 },
          '80%, 100%': { transform: 'scale(1.8)', opacity: 0 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
    },
  },
  plugins: [],
};
