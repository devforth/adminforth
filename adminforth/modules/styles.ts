

export const styles = () => ({
  colors: {
    lightHtml: "#FFFFFF", // main background

    lightPrimary: "#1a56db", // primary color
    lightPrimaryContrast: "alias:lightPrimary inverse", // primary color contrast
    lightPrimaryOpacity: "alias:lightPrimary opacity:0.05", // primary color opacity

    lightNavbar: "#FFFFFF", // navbar background
    lightNavbarBorder: "rgb(229 231 235)", // border
    lightNavbarText: "#111827", // navbar text
    lightNavbarTextHover: "alias:lightNavbarText darken", // navbar text hover
    lightNavbarTextActive: "alias:lightNavbarText darken", // navbar text active
    lightNavbarIcons: "alias:lightNavbarText opacity:0.7", // navbar icons
    lightAnnouncementText: "alias:lightPrimaryContrast", // announcement text
    lightAnnouncementBG: "alias:lightPrimary", // announcement

    lightSidebar: "#f9fafb", // sidebar background
    lightSidebarBorder: "alias:lightSidebarText opacity:0.05", // sidebar right border
    lightSidebarItemHover: "alias:lightSidebarText opacity:0.05", // sidebar list item hover
    lightSidebarItemActive: "alias:lightSidebarText opacity:0.05", // sidebar list item active
    lightSidebarText: "#213045", // sidebar list item text
    lightSidebarTextHover: "alias:lightSidebarText darken", // sidebar list item text hover
    lightSidebarTextActive: "alias:lightSidebarText darken", // sidebar list item text active
    lightSidebarDevider: "alias:lightSidebarText opacity:0.3", // sidebar devider
    lightSidebarIcons: "alias:lightSidebarText opacity:0.7", // sidebar list item icons
    lightSidebarIconsHover: "alias:lightSidebarText", // sidebar list item icons hover
    lightSidebarHeading: "alias:lightSidebarText opacity:0.3", // sidebar heading

    lightListSkeletLoader: "#E5E7EB",
    lightList: "#FFFFFF", // list view background
    lightListTable: "#FFFFFF", // list view table background
    lightListTableHeading: "#f5f5f8", // list view table heading
    lightListTableHeadingText: "#374151", // list view table heading text
    lightListTableText: "#6B7280", // list view table text
    lightListTableRowHover: "rgb(249 250 251)", // list view row hover
    // lightListBreadcrumbsText: "#666666", // list view breadcrumbs text
    lightListBorder: "#DDDDDD", // list view  rows 
    lightListTablePaginationBackgoround: "#FFFFFF",
    lightListTablePaginationBackgoroundHover: "#F3F4F6",
    lightListTablePaginationBorder: "#D1D5DB",
    lightListTablePaginationFocusRing: "#F3F4F6",
    ligthListTablePaginationText: "#111827",
    ligthListTablePaginationCurrentPageText: "#374151",
    ligthListTablePaginationTextHover: "alias:lightPrimary",
    ligthListTablePaginationHelpText: "#374151",

    lightForm: "#ffffff", // show view background
    lightFormBorder: "#F5F5F5", // show view rows border
    lightFormHeading: "alias:lightListTableHeading", // show view heading
    lightFormFieldTextColor: "alias:lightListTableText",

    lightShowTableHeadingBackground: "alias:lightFormHeading",
    lightShowTableHeadingText: "#374151",
    lightShowTableUnderHeadingBackground: "alias:lightFormHeading",
    lightShowTableUnderHeadingText: "#374151",
    lightShowTablesBodyBackground: "alias:lightForm",
    lightShowTableBodyText: "#6B7280",
    lightShowTableBodyBorder: "#F3F4F6",

    lightButtons: "#FFFFFF", // button background
    lightButtonsBorder: "#DDDDDD", // button border
    lightButtonsText: "#111827", // button text
    lightButtonsHover: "#f3f4f6", // button hover
    lightButtonsBorderHover: "#f3f4f6", // button border hover  
    lightButtonsActive: "#f3f4f6", // button active
    lightButtonsDisabled: "#f3f4f6", // button disabled
    lightButtonsDisabledText: "#f3f4f6", // button disabled text
    lightButtonsIcon: "#333333", // button icon
    
    lightDropdownButtonsBackground: "#f9fafb", // dropdown button/input background color
    lightDropownButtonsBorder: "#D1D5DB", //border color
    lightDropdownButtonsText: "alias:lightPrimary", //text color
    lightDropdownButtonsPlaceholderText: "#6B7280", //placeholder text color

    lightDropdownOptionsBackground: "#ffffff", //dropdown menu background color
    lightDropdownOptionsHoverBackground: "#F3F4F6", //dropdown menu hover background color
    lightDropdownPicked:"#F3F4F6", //dropdown ,enu picked option
    lightDropdownOptionsText: "#111827", //dropdown menu hover background color
    
    lightDropdownMultipleSelectBackground: "alias:lightPrimaryOpacity", //if select multiple, selected options background 
    lightDropdownMultipleSelectText: "alias:lightPrimary", // text color
    lightDropdownMultipleSelectIcon: "#9CA3AF", // delete select icon
    lightDropdownMultipleSelectIconHover: "#6B7280", // delete select icon color
    lightDropdownMultipleSelectIconFocus: "#6B7280", // delete select icon focus 
    lightDropdownMultipleSelectIconFocusBackground: "#F3F4F6", // delete select icon focus background


    lightCheckboxBgUnchecked: "alias:lightPrimaryContrast lighten",     //checkbox unchecked state bg
    lightCheckboxBgChecked: "alias:lightPrimary",        //cheched state bg
    lightCheckboxIconColor: "alias:lightPrimaryContrast lighten",       //checked icon color
    lightCheckboxBorderColor: "alias:lightPrimary darken",  //border color
    lightFocusRing: "alias:lightPrimary lighten", //focus ring color
    lightTextLabel: "black", //text color of checkbox label

    lightToggleBgUnactive: "alias:lightPrimaryContrast darken", //toggle unactive state background
    lightToggleBgActive: "alias:lightPrimary darken", //toggle active state background
    lightToggleCircle: "alias:lightPrimaryContrast lighten", //toggle circle color
    lightToggleRing: "alias:lightPrimary lighten", // toggle ring color
    lightToggleText: "black",  // color of text next to toggle
    lightToggleBorderUnactive: "alias:lightPrimary lighten", // unactive state border
    lightToggleBorderActive: "alias:lightPrimary darken", // active state border

    lightColumnValueInputBackground: "#f9fafb",  //input column value input background
    lightColumnValueInputPlaceholderText: "#6B7280", //placeholder text color
    lightColumnValueInputText: "#111827", //text color 
    lightColumnValueInputBorder: "#D1D5DB", //border color 
    lightColumnValueInputIcons: "#9CA3AF", //icons next to the input
    lightColumnValueInputFocusRing: "alias:lightPrimary",
    lightColumnValueInputFocusBorder: "alias:lightPrimary",

    lightInputBackground: "#f9fafb",  // input background
    lightInputPlaceholderText: "#6B7280", //placeholder text color
    lightInputText: "#111827", //text color 
    lightInputBorder: "#D1D5DB", //border color 
    lightInputBackgroundHover: "#F3F4F6", //hover
    lightInputTextHover: "alias:lightPrimary", //text hover
    lightInputBorderHover: "alias:lightInputBorder darken", //border hover
    lightInputFocusRing: "#F3F4F6", //focus ring
    lightInputFocusBorder: "alias:lightPrimary", 
    lightInputIconColor: "#6B7280", //input icon
    lightInputErrorColor: "#EF4444", //color of icon and text, when error shown
    lightRequiredIconColor: "#9CA3AF", //requires icon color

    lightDatePickerButtonBackground: "#F9FAFB",
    lightDatePickerButtonText: "#111827",
    lightDatePickerPlaceHolder: "#9CA3AF",
    lightDatePickerButtonBorder: "#D1D5DB",
    lightDatePickerIcon: "#6B7280",
    lightDatePickerExpandText: "alias:lightPrimary",

    lightTooltipBackground: "#111827",
    lightTooltipText: "#FFFFFF",

    lightVerticalTabsText: "#6B7280",
    lightVerticalTabsTextHover: "#374151",
    lightVerticalTabsBackground: "#F9FAFB",
    lightVerticalTabsBackgroundHover: "#F3F4F6",
    lightVerticalTabsTextActive: "alias:lightPrimaryContrast",
    lightVerticalTabsBackgroundActive: "alias:lightPrimary",
    lightVerticalTabsSlotText: "#6B7280 ",

    lightDialogBackgorund: "#FFFFFF",
    lightDialogBreakLine: "#E5E7EB",
    lightDialogHeaderText: "#111827",
    lightDialogCloseButton: "#9CA3AF",
    lightDialogCloseButtonHover: "#111827",
    lightDialogCloseButtonHoverBackground: "#E5E7EB",
    lightDialogBodyText: "#374151",

    lightDropzoneBackground: "#F9FAFB",
    lightDropzoneBackgroundHover: "#F3F4F6",
    lightDropzoneBorder: "#D1D5DB",
    lightDropzoneBorderHover: "#9CA3AF",
    lightDropzoneBorderDragging: "#2563EB",
    lightDropzoneBackgroundDragging: "#EFF6FF",
    lightDropzoneIcon: "#6B7280",
    lightDropzoneText: "#6B7280",

    lightTableBackground: "#FFFFFF",
    lightTableHeadingText: "#374151",
    lightTableHeadingBackground: "#F9FAFB",
    lightTableBorder: "#E5E7EB",
    lightTableText: "#6B7280",
    lightTableEvenBackground: "#F9FAFB",
    lightTableOddBackground: "#FFFFFF",
    lightTablePaginationText: "#6B7280",
    lightTablePaginationNumeration: "#111827",
    lightUnactivePaginationButtonBackground: "#FFFFFF",
    lightUnactivePaginationButtonText: "#6B7280",
    lightUnactivePaginationButtonBorder: "#D1D5DB",
    lightUnactivePaginationButtonHoverBackground: "#F3F4F6",
    lightUnactivePaginationButtonHoverText: "#374151",
    lightActivePaginationButtonBackground: "alias:lightPrimary",
    lightActivePaginationButtonText: "alias:lightPrimaryContrast",

    lightProgressBarUnfilledColor: "#E5E7EB",
    lightProgressBarFilledColor: "alias:lightPrimary",
    lightProgressBarText: "#6B7280",

    lightSkeletonBackgroundColor: "#D1D5DB",
    lightSkeletonIconColor: "#E5E7EB",

    lightAcceptModalBackground: "#FFFFFF",
    lightAcceptModalCloseIcon: "#9CA3AF",
    lightAcceptModalCloseIconHover: "#111827",
    lightAcceptModalCloseIconHoverBackground: "#E5E7EB",
    lightAcceptModalWarningIcon: "#9CA3AF",
    lightAcceptModalText: "#6B7280",
    lightAcceptModalConfirmButtonBackground: "#DC2626",
    lightAcceptModalConfirmButtonBackgroundHover: "#991B1B",
    lightAcceptModalConfirmButtonText: "#FFFFFF",
    lightAcceptModalConfirmButtonFocus: "#FCA5A5",
    lightAcceptModalCancelButtonBackground: "#FFFFFF",
    lightAcceptModalCancelButtonBackgroundHover: "#F3F4F6",
    lightAcceptModalCancelButtonText: "#111827",
    lightAcceptModalCancelButtonFocus: "#F3F4F6",
    lightAcceptModalCancelButtonBorder: "#E5E7EB",

    lightBreadcrumbsHomepageText: "#374151",
    lightBreadcrumbsHomepageTextHover: "alias:lightPrimary",
    lightBreadcrumbsArrowIcon: "#9CA3AF",
    lightBreadcrumbsText: "#6B7280",

    lightRangePickerButtonBackground: "#FFFFFF",
    lightRangePickerButtonBackgroundHover: "#F3F4F6",
    lightRangePickerButtonBorder: "#D1D5DB",
    lightRangePickerButtonText: "#111827",
    lightRangePickerButtonTextHover: "alias:lightPrimary",
    lightRangePickerFocusRing: "#F3F4F6",
    lightRangePickerInputBackground: "#F9FAFB",
    lightRangePickerInputBorder: "#D1D5DB",
    lightRangePickerInputText: "#111827",
    lightRangePickerInputPlaceholder: "#9CA3AF",

    lightFiltersBackgroung: "#FFFFFF",
    lightFiltersHeaderText: "#6B7280",
    lightFiltersCloseIcon: "#9CA3AF",
    lightFiltersCloseIconHover: "#111827",
    lightFiltersCloseIconHoverBackground: "#E5E7EB",
    lightFiltersClearAllButtonBackground: "#FFFFFF",
    lightFiltersClearAllButtonBackgroundHover: "#F3F4F6",
    lightFiltersClearAllButtonBorder: "#D1D5DB",
    lightFiltersClearAllButtonText: "#111827",
    lightFiltersClearAllButtonTextHover: "alias:lightPrimary",
    lightFiltersClearAllButtonFocus: "#F3F4F6",

    lightThreeDotsMenuIconBackground: "#FFFFFF",
    lightThreeDotsMenuIconBackgroundHover: "#F3F4F6",
    lightThreeDotsMenuIconBackgroundBorder: "#D1D5DB",
    lightThreeDotsMenuIconDots: "#111827",
    lightThreeDotsMenuIconDotsHover: "alias:lightPrimary",   
    lightThreeDotsMenuIconFocus: "#F3F4F6",   
    lightThreeDotsMenuBodyBackground: "#FFFFFF",
    lightThreeDotsMenuBodyBackgroundHover: "#F3F4F6",
    lightThreeDotsMenuBodyText: "#111827",
    lightThreeDotsMenuBodyTextHover: "#111827",

    lightToastBackground: "#FFFFFF",
    lightToastCloseIcon: "#9CA3AF",
    lightToastCloseIconHover: "#111827",
    lightToastCloseIconBackground: "#FFFFFF",
    lightToastCloseIconBackgroundHover: "#F3F4F6",
    lightToastCloseIconFocusRing: "#D1D5DB",
    lightToastText: "#6B7280",
    
    
    // colors for dark theme
    darkHtml: "#111827",

    darkPrimary: "rgb(130 172 255)", // primary color
    darkPrimaryContrast: "alias:darkPrimary inverse", // primary color contrast
    darkPrimaryOpacity: "alias:darkPrimary opacity:0.2", // primary color opacity

    darkNavbar: "#111827", 
    darkNavbarBorder: "#e5e7eb",
    darkNavbarText: "#9ca3af",
    darkNavbarTextHover: "alias:darkNavbarText lighten",
    darkNavbarTextActive: "alias:darkNavbarText lighten",
    darkNavbarIcons: "alias:darkNavbarText opacity:0.7",
    darkAnnouncementText: "alias:darkPrimaryContrast",
    darkAnnouncementBG: "alias:darkPrimary",

    darkSidebar: "#1f2937", 
    darkSidebarBorder: "alias:darkSidebarText opacity:0.3", 
    darkSidebarItemHover: "alias:darkSidebarText opacity:0.1", 
    darkSidebarItemActive: "alias:darkSidebarText opacity:0.4", 
    darkSidebarText: "#9ca3af", 
    darkSidebarTextHover: "alias:darkSidebarText lighten", 
    darkSidebarTextActive: "alias:darkSidebarText lighten", 
    darkSidebarDevider: "alias:darkSidebarText opacity:0.3", 
    darkSidebarIcons: "alias:darkSidebarText opacity:0.7", 
    darkSidebarIconsHover: "alias:darkSidebarText", 
    darkSidebarHeading: "alias:darkSidebarText opacity:0.3", 

    darkListSkeletLoader: "#374151",
    darkList: "#111111", 
    darkListTable: "#1f2937", 
    darkListTableHeading: "#374151", 
    darkListTableHeadingText: "#9ca3af",
    darkListTableText: "#9CA3AF", 
    darkListTableRowHover: "rgb(35 47 65)",
    // darkListBreadcrumbsText: "#BBBBBB", 
    darkListBorder: "#444444",
    darkListTablePaginationBackgoround: "#1F2937",
    darkListTablePaginationBackgoroundHover: "#374151",
    darkListTablePaginationBorder: "#4B5563",
    darkListTablePaginationFocusRing: "#374151",
    darkListTablePaginationText: "#9CA3AF",
    darkListTablePaginationCurrentPageText: "#9CA3AF",
    darkListTablePaginationTextHover: "#FFFFFF",
    darkListTablePaginationHelpText: "#9CA3AF", 

    darkForm: "#1F2937", 
    darkFormBorder: "#222222", 
    darkFormHeading: "alias:darkListTableHeading",
    darkFormFieldTextColor: "alias:darkListTableText",

    darkDropdownButtonsBackground: "#374151",
    darkDropownButtonsBorder: "#4b5563", 
    darkDropdownButtonsText: "#FFFFFF",
    darkDropdownButtonsPlaceholderText: "#9CA3AF",

    darkDropdownOptionsBackground: "#374151",
    darkDropdownOptionsHoverBackground: "#4b5563",
    darkDropdownPicked:"#212a40",
    darkDropdownOptionsText: "alias:darkListTableText",

    darkDropdownMultipleSelectBackground: "alias:darkPrimaryOpacity",
    darkDropdownMultipleSelectText: "alias:darkPrimary",
    darkDropdownMultipleSelectIcon: "#9CA3AF",
    darkDropdownMultipleSelectIconHover: "#6B7280",
    darkDropdownMultipleSelectIconFocus: "#6B7280",
    darkDropdownMultipleSelectIconFocusBackground: "#F3F4F6",

    darkCheckboxBgUnchecked: "#374151",   
    darkCheckboxBgChecked: "alias:darkPrimary",      
    darkCheckboxIconColor: "alias:darkPrimaryContrast lighten",    
    darkCheckboxBorderColor: "alias:darkPrimary darken",  
    darkFocusRing: "alias:darkPrimary lighten",
    darkTextLabel: "white",

    darkToggleBgUnactive: "alias:darkPrimaryContrast darken",
    darkToggleBgActive: "alias:darkPrimary darken",
    darkToggleCircle: "alias:darkPrimaryContrast lighten",
    darkToggleRing: "alias:darkPrimary lighten",
    darkToggleText: "alias:darkPrimaryContrast lighten", 
    darkToggleBorderUnactive: "alias:darkPrimary lighten",
    darkToggleBorderActive: "alias:darkPrimary darken",

    darkColumnValueInputBackground: "#374151",
    darkColumnValueInputPlaceholderText: "#9CA3AF",
    darkColumnValueInputText: "#FFFFFF",
    darkColumnValueInputBorder: "#4b5563",
    darkColumnValueInputIcons: "#9CA3AF",
    darkColumnValueInputFocusRing: "alias:darkPrimary",
    darkColumnValueInputFocusBorder: "alias:darkPrimary",

    darkInputBackground: "#374151",
    darkInputPlaceholderText: "#9CA3AF",
    darkInputText: "#FFFFFF",
    darkInputBorder: "#4b5563",
    darkInputHover: "#374151",
    darkInputTextHover: "#FFFFFF",
    darkInputBorderHover: "alias:darkInputBorder darken",
    darkInputFocusRing: "#374151",
    darkInputFocusBorder: "alias:darkPrimary", 
    darkInputIconColor: "#9CA3AF",
    darkInputErrorColor: "#F87171",
    darkRequiredIconColor: "#6B7280",

    darkDatePickerButtonBackground: "#374151",
    darkDatePickerButtonText: "#FFFFFF",
    darkDatePickerPlaceHolder: "#9CA3AF",
    darkDatePickerButtonBorder: "#4B5563",
    darkDatePickerIcon: "#9CA3AF",
    darkDatePickerExpandText: "alias:darkPrimary",

    darkTooltipBackground: "#374151",
    darkTooltipText: "#FFFFFF",

    darkVerticalTabsText: "#9CA3AF",
    darkVerticalTabsTextHover: "#FFFFFF",
    darkVerticalTabsBackground: "#1F2937",
    darkVerticalTabsBackgroundHover: "#374151",
    darkVerticalTabsTextActive: "alias:darkPrimaryContrast",
    darkVerticalTabsBackgroundActive: "alias:darkPrimary",
    darkVerticalTabsSlotText: "#9CA3AF ",

    darkDialogBackgorund: "#374151",
    darkDialogBreakLine: "#4B5563",
    darkDialogHeaderText: "#FFFFFF",
    darkDialogCloseButton: "#9CA3AF",
    darkDialogCloseButtonHover: "#FFFFFF",
    darkDialogCloseButtonHoverBackground: "#4B5563",
    darkDialogBodyText: "#9CA3AF",

    darkDropzoneBackground: "#1F2937",
    darkDropzoneBackgroundHover: "#4B5563",
    darkDropzoneBackgroundDragging: "#1E40AF",
    darkDropzoneBorder: "#4B5563",
    darkDropzoneBorderHover: "#6B7280",
    darkDropzoneBorderDragging: "#60A5FA",
    darkDropzoneIcon: "#9CA3AF",
    darkDropzoneText: "#9CA3AF",

    darkTableBackground: "#111827",
    darkTableHeadingText: "#9CA3AF",
    darkTableHeadingBackground: "#374151",
    darkTableBorder: "#374151",
    darkTableText: "#9CA3AF",
    darkTableEvenBackground: "#1F2937",
    darkTableOddBackground: "#111827",
    darkTablePaginationText: "#9CA3AF",
    darkTablePaginationNumeration: "#FFFFFF",
    darkUnactivePaginationButtonBackground: "#1F2937",
    darkUnactivePaginationButtonText: "#9CA3AF",
    darkUnactivePaginationButtonBorder: "#374151",
    darkUnactivePaginationButtonHoverBackground: "#374151",
    darkUnactivePaginationButtonHoverText: "#FFFFFF",
    darkActivePaginationButtonBackground: "alias:darkPrimary",
    darkActivePaginationButtonText: "alias:darkPrimaryContrast",

    darkProgressBarUnfilledColor: "#374151",
    darkProgressBarFilledColor: "alias:darkPrimary",
    darkProgressBarText: "#6B7280",

    darkSkeletonBackgroundColor: "#374151",
    darkSkeletonIconColor:"#4B5563",

    darkAcceptModalBackground: "#374151",
    darkAcceptModalCloseIcon: "#9CA3AF",
    darkAcceptModalCloseIconHover: "#FFFFFF",
    darkAcceptModalCloseIconHoverBackground: "#4B5563",
    darkAcceptModalWarningIcon: "#E5E7EB",
    darkAcceptModalText: "#9CA3AF",
    darkAcceptModalConfirmButtonBackground: "#DC2626",
    darkAcceptModalConfirmButtonBackgroundHover: "#991B1B",
    darkAcceptModalConfirmButtonText: "#FFFFFF",
    darkAcceptModalConfirmButtonFocus: "#991B1B",
    darkAcceptModalCancelButtonBackground: "#1F2937",
    darkAcceptModalCancelButtonBackgroundHover: "#374151",
    darkAcceptModalCancelButtonText: "#9CA3AF",
    darkAcceptModalCancelButtonTextHover: "#FFFFFF",
    darkAcceptModalCancelButtonFocus: "#1F2937",
    darkAcceptModalCancelButtonBorder: "#4B5563",

    darkBreadcrumbsHomepageText: "#9CA3AF",
    darkBreadcrumbsHomepageTextHover: "#FFFFFF",
    darkBreadcrumbsArrowIcon: "#9CA3AF",
    darkBreadcrumbsText: "#9CA3AF",

    darkRangePickerButtonBackground: "#1F2937",
    darkRangePickerButtonBackgroundHover: "#374151",
    darkRangePickerButtonBorder: "#4B5563",
    darkRangePickerButtonText: "#9CA3AF",
    darkRangePickerButtonTextHover: "#FFFFFF",
    darkRangePickerFocusRing: "#374151",
    darkRangePickerInputBackground: "#374151",
    darkRangePickerInputBorder: "#4B5563",
    darkRangePickerInputText: "#FFFFFF",
    darkRangePickerInputPlaceholder: "#9CA3AF",

    darkFiltersBackgroung: "#1F2937",
    darkFiltersHeaderText: "#9CA3AF",
    darkFiltersCloseIcon: "#9CA3AF",
    darkFiltersCloseIconHover: "#FFFFFF",
    darkFiltersCloseIconHoverBackground: "#4B5563",
    darkFiltersClearAllButtonBackground: "#1F2937",
    darkFiltersClearAllButtonBackgroundHover: "#374151",
    darkFiltersClearAllButtonBorder: "#4B5563",
    darkFiltersClearAllButtonText: "#9CA3AF",
    darkFiltersClearAllButtonTextHover: "#FFFFFF",
    darkFiltersClearAllButtonFocus: "#374151",

    darkShowTableHeadingBackground: "alias:darkFormHeading",
    darkShowTableHeadingText: "#9CA3AF",
    darkShowTableUnderHeadingBackground: "alias:darkFormHeading",
    darkShowTableUnderHeadingText: "#9CA3AF",
    darkShowTablesBodyBackground: "alias:darkForm",
    darkShowTableBodyText: "#9CA3AF",
    darkShowTableBodyBorder: "#F3F4F6",

    darkThreeDotsMenuIconBackground: "#1F2937",
    darkThreeDotsMenuIconBackgroundHover: "#374151",
    darkThreeDotsMenuIconBackgroundBorder: "#4B5563",
    darkThreeDotsMenuIconDots: "#9CA3AF",
    darkThreeDotsMenuIconDotsHover: "#FFFFFF",   
    darkThreeDotsMenuIconFocus: "#374151",   
    darkThreeDotsMenuBodyBackground: "#374151",
    darkThreeDotsMenuBodyBackgroundHover: "#4B5563",
    darkThreeDotsMenuBodyText: "#9CA3AF",
    darkThreeDotsMenuBodyTextHover: "#FFFFFF",

    darkToastBackground: "#1F2937",
    darkToastCloseIcon: "#6B7280",
    darkToastCloseIconHover: "#FFFFFF",
    darkToastCloseIconBackground: "#1F2937",
    darkToastCloseIconBackgroundHover: "#374151",
    darkToastCloseIconFocusRing: "#374151",
    darkToastText: "#9CA3AF",

  },
  boxShadow: {
    customLight: "0 4px 8px rgba(0, 0, 0, 0.1)", // Lighter shadow
    headerShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Lighter shadow
    listTableShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Lighter shadow
    darkListTableShadow: "0 4px 8px rgba(0, 0, 0, 0.3)", // Lighter shadow
    resourseFormShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Lighter shadow
    darkResourseFormShadow: "0 4px 8px rgba(0, 0, 0, 0.3)", // Lighter shadow

  },
  fontSize: {
    "headerText-size": "1rem"
  },
  borderRadius: {
    "default": ".5rem"
  }
});

