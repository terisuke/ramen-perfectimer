import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ramen: {
          50: '#FFF8F0',
          100: '#FFEFD5',
          200: '#FFD9A0',
          300: '#FFC06A',
          400: '#FFA53B',
          500: '#FF8C00',
          600: '#E07800',
          700: '#B86000',
          800: '#8C4A00',
          900: '#5C3000',
        },
        soup: {
          warm: '#FFF3E0',
          light: '#FFF8F0',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
