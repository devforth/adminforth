/** @type {import('tailwindcss').Config} */

export default {
  content:  ["./src/**/*.{vue, js, ts, tsx}","./src/*.{vue, js, ts, tsx}", "./index.html", "./node_modules/flowbite/**/*.js"],
  safelist: [
    /* IMPORTANT:ADMINFORTH TAILWIND SAFELIST */
  ],
  theme: {
    extend: {
      /* IMPORTANT:ADMINFORTH TAILWIND STYLES */
    }
  },

  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
