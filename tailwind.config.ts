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
      // ── Color Palette: Refined MasmSpace Dark System ─────────────────────
      colors: {
        masm: {
          canvas:     '#0D0D0F', // Main canvas background
          surface:    '#111113', // Canvas secondary surface
          toolbar:    '#171719', // Unified top bar & controls
          elevated:   '#1C1C1F', // Elevated panels, flyouts, modals
          hover:      '#242428', // Subtle hover states
          border:     '#2A2A2F', // Precise borders
          text:       '#F4F4F5', // Primary high-contrast text
          secondary:  '#A1A1AA', // Secondary descriptive text
          muted:      '#71717A', // Muted micro labels / shortcuts
          accent:     '#7C6CFF', // Primary subtle purple/indigo accent
          'accent-hover': '#635BFF', // Secondary accent
          success:    '#4ADE80', // Status success
          warning:    '#FBBF24', // Status warning
          error:      '#F87171', // Destructive / error
        },
        midnight: {
          DEFAULT: '#0D0D0F',
          dark:    '#0B0B0D',
          deep:    '#08080A',
          surface: '#111113',
          card:    '#171719',
          border:  '#2A2A2F',
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
          purple:  '#7C6CFF',
          blue:    '#3b82f6',
          cyan:    '#06b6d4',
          emerald: '#4ADE80',
          teal:    '#14b8a6',
          violet:  '#7C6CFF',
          indigo:  '#635BFF',
        },
        void: {
          DEFAULT: '#0D0D0F',
          dark:    '#0B0B0D',
          surface: '#111113',
          raised:  '#171719',
        },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
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
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.85' },
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

      // ── Box shadows: Refined, non-neon shadows ─────────────────────────
      boxShadow: {
        'masm-subtle': '0 1px 3px rgba(0,0,0,0.2)',
        'masm-panel':  '0 8px 30px rgba(0,0,0,0.25)',
        'masm-elevated': '0 12px 36px -4px rgba(0,0,0,0.35)',
        'masm-dropdown': '0 10px 38px -10px rgba(0,0,0,0.45), 0 10px 20px -15px rgba(0,0,0,0.35)',
        'masm-tooltip': '0 4px 12px rgba(0,0,0,0.3)',
      },
    },
  },

  plugins: [],
};

export default config;
