/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0b132b',
          navy: '#0f172a',
          surface: '#1e293b',
          blue: '#2563eb',
          cyan: '#0284c7',
          teal: '#0d9488',
          tealLight: '#14b8a6',
          slate: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0'
        },
        health: {
          critical: '#dc2626',
          warning: '#ea580c',
          attention: '#d97706',
          normal: '#16a34a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
