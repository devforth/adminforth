import { twMerge, type ClassNameValue } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export const buttonBaseStyles = `
  flex items-center justify-center
  gap-1 border focus:ring-4 focus:outline-none
  focus:ring-opacity-50 font-medium rounded-lg
  text-sm px-5 py-2.5 text-center transition-all duration-200
`;

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary: `
    text-lightButtonsText bg-lightButtonsBackground border-lightButtonsBorder
    dark:bg-darkButtonsBackground hover:bg-lightButtonsHover
    hover:border-lightButtonsBorderHover focus:ring-lightButtonFocusRing
    dark:focus:ring-darkButtonFocusRing dark:text-darkButtonsText
    dark:border-darkButtonsBorder dark:hover:bg-darkButtonsHover
    dark:hover:border-darkButtonsBorderHover
  `,

  secondary: `
    text-lightSecondaryContrast/90 bg-lightSecondary border-lightSecondaryContrast/15
    hover:bg-lightSecondaryDarken focus:ring-lightSecondary hover:text-lightPrimary

    dark:bg-darkSecondary dark:focus:ring-darkSecondary/40 dark:text-darkSecondaryContrast/60
    dark:border-darkSecondaryContrast/15 dark:hover:bg-darkSecondaryLighten
    dark:hover:text-white
  `,

  danger: `
    text-lightAcceptModalConfirmButtonText dark:text-darkAcceptModalConfirmButtonText
    bg-lightAcceptModalConfirmButtonBackground dark:bg-darkAcceptModalConfirmButtonBackground
    hover:bg-lightAcceptModalConfirmButtonBackgroundHover dark:hover:bg-darkAcceptModalConfirmButtonBackgroundHover
    focus:ring-lightAcceptModalConfirmButtonFocus dark:focus:ring-darkAcceptModalConfirmButtonFocus
    border-transparent hover:border-transparent
  `,
};

export const buttonActiveStyles = 'active brightness-200 hover:brightness-150';

export const buttonDisabledStyles = 'cursor-default opacity-50 pointer-events-none';


export function getButtonClasses(
  options: {
    variant?: ButtonVariant;
    shadow?: boolean;
    active?: boolean;
    disabled?: boolean;
  },
  ...extraClasses: ClassNameValue[]
): string {
  return twMerge(
    buttonBaseStyles,
    buttonVariantStyles[options.variant ?? 'primary'],
    options.shadow && 'af-button-shadow',
    options.active && buttonActiveStyles,
    options.disabled && buttonDisabledStyles,
    ...extraClasses,
  );
}
