/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-elevated)',
          hover: 'var(--bg-surface-hover)',
        },
        border: 'var(--border-subtle)',
        primary: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--chart-tx)',
        },
        text: {
          primary: 'var(--text-main)',
          secondary: 'var(--text-muted)',
          muted: 'var(--text-dim)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
