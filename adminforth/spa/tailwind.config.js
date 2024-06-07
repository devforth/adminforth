/** @type {import('tailwindcss').Config} */
export default {
  content:  ["./src/**/*.{vue, js}","./src/*.{vue, js}", "./index.html", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      /* IMPORTANT:ADMINFORTH TAILWIND STYLES */
  }
  },

  darkMode: 'class',
  plugins: [
    require('flowbite/plugin'),
  ],
}

