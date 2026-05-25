import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-devanagari)', 'var(--font-mukta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // Design system tokens — exact values from MASTER.md
        primary: {
          DEFAULT: '#1D4ED8',
          light: '#3B82F6',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#EA580C',
          foreground: '#FFFFFF',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        // Shadcn-compatible aliases
        background: '#F1F5F9',
        foreground: '#0F172A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#475569',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#1D4ED8',
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 15px rgba(0,0,0,0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
