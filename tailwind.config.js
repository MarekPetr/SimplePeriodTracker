/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './screens/**/*.{js,ts,tsx}',
    './navigation/**/*.{js,ts,tsx}',
    './i18n/**/*.{js,ts,tsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        red: {
          50:  '#fdebec',   // very light red, but not pink
          100: '#fbd6d9',
          200: '#f5adb3',
          300: '#ec7a84',
          400: '#e3475a',
          500: '#c71a2b',   // FRESH BLOOD TONE (dominant crimson)
          600: '#a91524',
          700: '#8c111e',
          800: '#6e0d17',
          900: '#4f0911',   // coagulated blood depth
          950: '#34060c',
        }
      },
    },
  },
  plugins: [],
};
