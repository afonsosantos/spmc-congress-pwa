import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Matches the congresso-spmc.com 2027 site's wine/gold identity.
        brand: {
          50: '#fbf3f4',
          100: '#f6e4e8',
          200: '#ecc9d1',
          300: '#dda3b0',
          400: '#c17b8d',
          500: '#9c5566',
          600: '#7a3a4a',
          700: '#4a1e2c', // primary — matches --wine-1 on the marketing site
          800: '#3a1723',
          900: '#2b1019',
        },
        gold: {
          50: '#fdf6ec',
          100: '#faebd3',
          200: '#f3d3a1',
          300: '#ecbb74',
          400: '#e0a750', // matches --gold-light
          500: '#c9822e', // matches --gold — primary CTA color on the marketing site
          600: '#ab6a22',
          700: '#86531c',
          800: '#613c14',
          900: '#3d260c',
        },
        cream: '#fffdf9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Editorial serif for headings, matching the marketing site's Georgia headlines.
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
