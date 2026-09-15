/** @type {import('tailwindcss').Config} */

export default {
  // no spaces inside the braces, otherwise extensions are expanded as "* js", "* ts" and
  // classes declared in plain .ts/.js files (e.g. afcl/buttonStyles.ts) are not generated
  content:  ["./src/**/*.{vue,js,ts,tsx}","./src/*.{vue,js,ts,tsx}", "./index.html", "./node_modules/flowbite/**/*.js"],
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
