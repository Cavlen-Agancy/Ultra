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
        // Direct brand tokens, driven by CSS variables from main.css.
        'brand-red': 'var(--brand-red)',
        'brand-red-dark': 'var(--brand-red-dark)',
        // `ink` doubles as the flat brand token and the legacy admin scale
        // (`bg-ink-950`, `dark:hover:bg-ink-800`) used across the admin panel.
        ink: {
          DEFAULT: 'var(--ink)',
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
        'ink-soft': 'var(--ink-soft)',
        surface: 'var(--surface)',
        'surface-gray': 'var(--surface-gray)',
        'grid-line': 'var(--grid-line)',

        // Long-lived legacy palette kept for admin/internal compatibility.
        ultra: {
          50: '#FFF1F0',
          100: '#FFE0DE',
          200: '#FFC7C5',
          300: '#FFA09C',
          400: '#F66A65',
          500: '#D32F2F',
          600: '#B71C1C',
          700: '#961818',
          800: '#7D1C1B',
          900: '#681B1A',
        },
        ink2: {
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

        // Semantic tokens, still mode-aware through CSS vars.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'var(--text-muted)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        accent: 'var(--brand-red)',
        'accent-hover': 'var(--brand-red-dark)',
        'on-accent': '#FFFFFF',
        // Deeper red for text/links on white surfaces.
        'accent-text': 'var(--brand-red-dark)',

        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      backgroundImage: {
        // Almost invisible geometric grid pattern for light brand sections.
        'ultra-grid': 'var(--ultra-grid-pattern)',
      },
      boxShadow: {
        ultra: '0 12px 40px -20px rgb(0 0 0 / 0.32)',
      },
      fontFamily: {
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
        sm: '2px',
        DEFAULT: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
