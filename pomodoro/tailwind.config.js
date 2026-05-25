/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        focus: {
          DEFAULT: '#ef4444',
          dark: '#7f1d1d',
          glow: '#fca5a5'
        },
        shortBreak: {
          DEFAULT: '#22c55e',
          dark: '#14532d',
          glow: '#86efac'
        },
        longBreak: {
          DEFAULT: '#3b82f6',
          dark: '#1e3a8a',
          glow: '#93c5fd'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
};
