import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/plugins/**/*.{ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutral placeholder palette. Replace with the Ultra brand palette.
        gold: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        ink: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        paper: {
          50: '#F5F5F5',
          100: '#EDEDED',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
        },

        // Layer 2: semantic tokens (mode-aware via CSS vars) — components use these
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        // Deeper gold for text/links on light surfaces (gold-500 fails contrast there)
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',

        // Status tokens (fixed in both modes)
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      backgroundImage: {
        // Neutral placeholder CTA gradient until the Ultra palette is chosen.
        'gold-gradient': 'linear-gradient(135deg, #A3A3A3 0%, #737373 48%, #525252 100%)',
      },
      boxShadow: {
        // Neutral placeholder CTA shadow.
        gold: '0 8px 24px -10px rgb(115 115 115 / 0.22)',
      },
      fontFamily: {
        // Language-aware stacks — resolved from CSS vars so the typeface
        // follows html[lang] (Arabic vs English). See assets/css/main.css.
        display: ['var(--font-display)'],
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
