// the fields of DatePicker and of the date range filter: date, time and the box around both halves of a range.
// focus-within instead of focus, so the same box works on an input and on a wrapper of inputs

export const PICKER_BOX_CLASSES = `
  h-[34px] rounded-default border shadow-customLight transition-colors focus-within:ring-[3px]
  bg-lightDatePickerButtonBackground border-lightDatePickerButtonBorder hover:border-lightInputBorderHover
  focus-within:ring-lightInputFocusRing focus-within:border-lightInputFocusBorder
  dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:hover:border-darkInputBorderHover
  dark:focus-within:ring-darkInputFocusRing dark:focus-within:border-darkInputFocusBorder
`;

// the box keeps the focus look while the keyboard is inside its calendar
export const PICKER_BOX_OPEN_CLASSES = `
  ring-[3px] ring-lightInputFocusRing border-lightInputFocusBorder dark:ring-darkInputFocusRing dark:border-darkInputFocusBorder
`;

export const PICKER_TEXT_CLASSES = `
  text-sm leading-5 tabular-nums focus:outline-none disabled:cursor-not-allowed
  text-lightDatePickerButtonText placeholder-lightDatePickerPlaceHolder
  dark:text-darkDatePickerButtonText dark:placeholder-darkDatePickerPlaceHolder
`;

export const PICKER_ICON_CLASSES = `
  absolute inset-y-0 start-2.5 my-auto w-4 h-4 pointer-events-none text-lightDatePickerIcon dark:text-darkDatePickerIcon
`;
