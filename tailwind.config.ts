import type { Config } from 'tailwindcss';

const config: Config = {
  // Dark mode enabled via 'class' strategy for next-themes compatibility
  darkMode: 'class',

  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // ── Color Palette: Midnight Oceanic & Aurora ─────────────────────────
      colors: {
        midnight: {
          DEFAULT: '#09090b',
          dark:    '#030712',
          deep:    '#02040a',
          surface: '#0d1117',
          card:    'rgba(17, 24, 39, 0.7)',
          border:  'rgba(255, 255, 255, 0.08)',
        },
        ocean: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        aurora: {
          purple:  '#a855f7',
          blue:    '#3b82f6',
          cyan:    '#06b6d4',
          emerald: '#10b981',
          teal:    '#14b8a6',
          violet:  '#8b5cf6',
          indigo:  '#6366f1',
        },
        neon: {
          cyan:   '#00f5ff',
          purple: '#a855f7',
          orange: '#f97316',
          green:  '#22c55e',
          pink:   '#ec4899',
          yellow: '#eab308',
        },
        void: {
          DEFAULT: '#09090b',
          dark:    '#030712',
          surface: '#0f172a',
          raised:  '#1e293b',
        },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Animations ──────────────────────────────────────────────────────
      animation: {
        'pulse-neon':    'pulse-neon 2s ease-in-out infinite',
        'float':         'float 4s ease-in-out infinite',
        'glow-breathe':  'glow-breathe 3s ease-in-out infinite',
        'scan-line':     'scan-line 4s linear infinite',
        'aurora-mesh':   'aurora-mesh 12s ease infinite alternate',
        'spin-slow':     'spin 8s linear infinite',
        'shimmer-text':  'shimmer-text 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'glow-breathe': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6,182,212,0.2)' },
          '50%':      { boxShadow: '0 0 45px rgba(6,182,212,0.6), 0 0 85px rgba(168,85,247,0.35)' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'aurora-mesh': {
          '0%': {
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)',
          },
          '100%': {
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(30deg)',
          },
        },
        'shimmer-text': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(45deg)',
          },
        },
      },

      // ── Backdrop blur ───────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        md: '12px',
        xl: '20px',
        '2xl': '32px',
      },

      // ── Box shadows ─────────────────────────────────────────────────────
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)',
        'neon-purple': '0 0 20px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.1)',
        'aurora-glow': '0 0 40px rgba(6,182,212,0.35), 0 0 80px rgba(139,92,246,0.2)',
        'glass':       '0 8px 32px rgba(0,0,0,0.37), inset 0 0 20px rgba(255,255,255,0.05)',
        'glass-card':  '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },

  plugins: [],
};

export default config;
