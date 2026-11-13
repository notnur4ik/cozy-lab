import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F3EE',
        sand: '#E8DED2',
        taupe: '#B9A797',
        mocha: '#51443E',
        dark: '#292522',
        white: '#FFFFFF',
        border: '#E8DED2',
        background: '#F7F3EE',
        foreground: '#292522',
        primary: {
          DEFAULT: '#51443E',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E8DED2',
          foreground: '#292522',
        },
        muted: {
          DEFAULT: '#E8DED2',
          foreground: '#51443E',
        },
        accent: {
          DEFAULT: '#B9A797',
          foreground: '#292522',
        },
        destructive: {
          DEFAULT: '#9E3B33',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(41, 37, 34, 0.06)',
        card: '0 2px 16px -2px rgba(41, 37, 34, 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
