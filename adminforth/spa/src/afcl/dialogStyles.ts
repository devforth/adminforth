// a dialog panel is centered on desktop and docks to the bottom edge as a sheet on phones (below `sm`),
// `max-sm:` keeps the width classes an app passes to Dialog/Modal in charge on desktop
export const dialogPanelClasses = `
  relative mt-auto sm:mb-auto rounded-xl
  bg-lightDialogBackgorund dark:bg-darkDialogBackgorund shadow-popover dark:shadow-darkPopover
  max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:pb-[env(safe-area-inset-bottom)]
`;

// actions sit in a gray band on desktop, in the sheet they are stacked full width with the last (main) one on top
export const dialogFooterClasses = `
  flex flex-col-reverse gap-2 px-5 pb-5
  sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:py-3 sm:rounded-b-xl
  sm:border-t sm:border-lightDialogBreakLine sm:dark:border-darkDialogBreakLine
  sm:bg-lightFormHeading sm:dark:bg-darkFormHeading
`;
