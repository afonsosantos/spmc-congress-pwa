/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf6',
          100: '#d5f5e8',
          200: '#aeead4',
          300: '#79d9ba',
          400: '#43bf9d',
          500: '#22a382',
          600: '#158268',
          700: '#0f6e5c', // primary
          800: '#12574a',
          900: '#12483e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
