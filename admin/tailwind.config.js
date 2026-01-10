/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a1a2e',
          hover: '#252542',
          active: '#3d3d6b',
        },
        primary: {
          DEFAULT: '#6366f1',
          hover: '#5558e3',
          light: '#e0e7ff',
        },
        accent: {
          purple: '#a855f7',
          green: '#22c55e',
          orange: '#f97316',
          red: '#ef4444',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
