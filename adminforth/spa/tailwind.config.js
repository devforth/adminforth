/** @type {import('tailwindcss').Config} */
export default {
  content:  ["./src/**/*.{vue, js}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    require('flowbite/plugin'),
  ],
}

