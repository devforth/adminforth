import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonSize = 'md' | 'sm';

export const buttonBaseStyles = `
  flex items-center justify-center
  gap-1.5 border focus-visible:ring-[3px] focus:outline-none
  font-medium rounded-default whitespace-nowrap
  text-sm leading-5 px-3.5 py-1.5 text-center transition-colors duration-150
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    text-lightButtonsText bg-lightButtonsBackground border-lightButtonsBorder
    focus-visible:ring-lightButtonFocusRing

    dark:text-darkButtonsText dark:bg-darkButtonsBackground dark:border-darkButtonsBorder
    dark:focus-visible:ring-darkButtonFocusRing
  `,

  secondary: `
    text-lightSecondaryContrast/90 bg-lightSecondary border-lightSecondaryContrast/[0.17]
    focus-visible:ring-lightFocusRing

    dark:text-darkSecondaryContrast/80 dark:bg-darkSecondary dark:border-darkSecondaryContrast/[0.17]
    dark:focus-visible:ring-darkFocusRing
  `,

  danger: `
    text-lightAcceptModalConfirmButtonText dark:text-darkAcceptModalConfirmButtonText
    bg-lightAcceptModalConfirmButtonBackground dark:bg-darkAcceptModalConfirmButtonBackground
    focus-visible:ring-lightAcceptModalConfirmButtonFocus dark:focus-visible:ring-darkAcceptModalConfirmButtonFocus
    border-transparent
  `,

  ghost: `
    bg-transparent border-transparent text-lightInputIconColor focus-visible:ring-lightFocusRing
    dark:text-darkInputIconColor dark:focus-visible:ring-darkFocusRing
  `,
};

// kept apart so a disabled button gets no hover feedback
const variantHoverStyles: Record<ButtonVariant, string> = {
  primary: `
    hover:bg-lightButtonsHover hover:border-lightButtonsBorderHover
    dark:hover:bg-darkButtonsHover dark:hover:border-darkButtonsBorderHover
  `,
  secondary: `
    hover:bg-lightSecondaryDarken hover:text-lightSecondaryContrast
    dark:hover:bg-darkSecondaryLighten dark:hover:text-darkSecondaryContrast
  `,
  danger: `
    hover:bg-lightAcceptModalConfirmButtonBackgroundHover hover:border-transparent
    dark:hover:bg-darkAcceptModalConfirmButtonBackgroundHover
  `,
  ghost: `
    hover:bg-lightSecondaryDarken hover:text-lightInputText
    dark:hover:bg-darkSecondaryLighten dark:hover:text-darkInputText
  `,
};

// public styles of an enabled button, for apps which style their own elements as AFCL buttons
export const buttonVariantStyles = Object.fromEntries(
  Object.entries(variantStyles).map(([variant, styles]) => [variant, `${styles} ${variantHoverStyles[variant as ButtonVariant]}`]),
) as Record<ButtonVariant, string>;

// md is the base size, its height comes from the padding and line height of the label
export const buttonSizeStyles: Record<ButtonSize, string> = {
  md: '',
  sm: 'h-7 py-0 px-2.5 text-xs',
};

// a square button with one icon in the slot
export const buttonIconOnlyStyles: Record<ButtonSize, string> = {
  md: 'h-[2.125rem] w-[2.125rem] shrink-0 p-0 [&>svg]:w-4 [&>svg]:h-4',
  sm: 'w-7 shrink-0 p-0 [&>svg]:w-4 [&>svg]:h-4',
};

export const buttonActiveStyles = 'active brightness-200 hover:brightness-150';

export const buttonDisabledStyles = 'cursor-not-allowed opacity-50';


export function getButtonClasses(
  options: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconOnly?: boolean;
    shadow?: boolean;
    active?: boolean;
    disabled?: boolean;
  },
  ...extraClasses: ClassNameValue[]
): string {
  const variant = options.variant ?? 'primary';
  const size = options.size ?? 'md';
  return mergeClasses(
    buttonBaseStyles,
    variantStyles[variant],
    !options.disabled && variantHoverStyles[variant],
    buttonSizeStyles[size],
    options.iconOnly && buttonIconOnlyStyles[size],
    // ghost has no surface to lift
    options.shadow && variant !== 'ghost' && 'af-button-shadow',
    options.active && buttonActiveStyles,
    options.disabled && buttonDisabledStyles,
    ...extraClasses,
  );
}
