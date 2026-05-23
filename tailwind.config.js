/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        alert: {
          blue:   '#3B82F6',
          orange: '#F97316',
          red:    '#EF4444',
          green:  '#22C55E',
        }
      },
      minWidth: {
        '320': '1280px'
      }
    }
  },
  plugins: []
}
