/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090811',
        surface: {
          DEFAULT: '#12101C',
          secondary: '#1A1728',
          hover: '#221E34',
        },
        border: '#29243A',
        primary: {
          DEFAULT: '#A78BFA',
          hover: '#8B5CF6',
          light: '#C4B5FD',
        },
        secondary: {
          DEFAULT: '#EC4899',
          hover: '#DB2777',
        },
        text: {
          primary: '#F5F3FF',
          secondary: '#A49BB8',
          muted: '#6B6280',
        },
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(167, 139, 250, 0.3)',
        'glow-secondary': '0 0 20px -5px rgba(236, 72, 153, 0.3)',
      },
    },
  },
  plugins: [],
}
