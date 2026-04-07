export default (options: any) => ({
  base: 'afcl-button flex items-center justify-center gap-1 border focus:ring-4 focus:outline-none focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 text-center',
  variants: {
    disabled: {
      true: 'cursor-default opacity-50 pointer-events-none',
    },
    active: {
      true: 'active brightness-200 hover:brightness-150',
    },
    mode: {
      primary: 'text-lightButtonsText bg-lightButtonsBackground border-lightButtonsBorder dark:bg-darkButtonsBackground hover:bg-lightButtonsHover hover:border-lightButtonsBorderHover focus:ring-lightButtonFocusRing dark:focus:ring-darkButtonFocusRing dark:text-darkButtonsText dark:border-darkButtonsBorder dark:hover:bg-darkButtonsHover dark:hover:border-darkButtonsBorderHover',
      secondary: 'text-lightSecondaryContrast/70 bg-lightSecondary border-lightSecondaryContrast/30 dark:bg-darkSecondary hover:bg-lightSecondary/60 hover:border-lightSecondaryContrast/60 focus:ring-lightSecondary dark:focus:ring-darkSecondary/40 dark:text-darkSecondaryContrast dark:border-darkSecondaryContrast/40 dark:hover:bg-darkSecondary/60 dark:hover:border-darkSecondary/60',
    },
  },
})

