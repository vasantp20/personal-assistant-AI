/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        text: 'text 2s ease infinite',
      },
      keyframes: {
        text: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
        },
      },
    },
  },
  plugins: [],
}
