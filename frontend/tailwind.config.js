/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        notebook: '#F8F5E6',
        grid: '#DAD7C9',
        ink: '#1D3557',
        btn: '#3A86FF',
        pink: '#FF8FAB',
        grey: '#6C757D',
        yes: '#2DC653',
        no: '#E63946',
        warn: '#FB8500',
      },
      fontFamily: {
        hand: ['"Patrick Hand"', 'cursive'],
        comic: ['"Comic Neue"', 'cursive'],
      },
    },
  },
  plugins: [],
}
