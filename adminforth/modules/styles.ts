export const styles = () => ({
  colors: {
    lightHtml: "#FAFAFA", // main background

    lightPrimary: "#1a56db", // primary color
    lightPrimaryContrast: "alias:lightPrimary inverse", // primary color contrast
    lightPrimaryOpacity: "alias:lightPrimary opacity:0.05", // primary color opacity

    lightSecondary: "#ffffff", // secondary color
    lightSecondaryDarken: "#F4F4F5",
    lightSecondaryContrast: "alias:lightSecondary inverse", // secondary color contrast

    // status colors of badges, alerts, toasts and diffs: text and icons, soft background, border
    lightSuccess: "#067647",
    lightSuccessSoft: "#ECFDF3",
    lightSuccessBorder: "#ABEFC6",
    lightWarning: "#B54708",
    lightWarningSoft: "#FFFAEB",
    lightWarningBorder: "#FEDF89",
    lightDanger: "#B42318",
    lightDangerSoft: "#FEF3F2",
    lightDangerBorder: "#FECDCA",

    lightNavbar: "#FAFAFA", // navbar background
    lightNavbarBorder: "#E4E4E7", // border
    lightNavbarText: "#3F3F46", // navbar text
    lightNavbarTextHover: "alias:lightNavbarText darken", // navbar text hover
    lightNavbarTextActive: "alias:lightNavbarText darken", // navbar text active
    lightNavbarIcons: "alias:lightNavbarText opacity:0.7", // navbar icons
    lightAnnouncementText: "alias:lightPrimaryContrast", // announcement text
    lightAnnouncementBG: "alias:lightPrimary", // announcement

    lightSidebar: "#FAFAFA", // sidebar background
    lightSidebarBorder: "alias:lightSidebarText opacity:0.12", // sidebar right border
    lightSidebarItemHover: "alias:lightSidebarText opacity:0.05", // sidebar list item hover
    lightSidebarItemActive: "alias:lightSidebarText opacity:0.09", // sidebar list item active
    lightSidebarText: "#3F3F46", // sidebar list item text
    lightSidebarTextHover: "alias:lightSidebarText darken", // sidebar list item text hover
    lightSidebarTextActive: "alias:lightSidebarText darken", // sidebar list item text active
    lightSidebarDevider: "alias:lightSidebarText opacity:0.12", // sidebar devider
    lightSidebarIcons: "alias:lightSidebarText opacity:0.75", // sidebar list item icons
    lightSidebarIconsHover: "alias:lightSidebarText", // sidebar list item icons hover
    lightSidebarHeading: "alias:lightSidebarText opacity:0.6", // sidebar heading


    /*************************************************************** 
    *                                                              *
    *                          Light Views                         *
    *                                                              *
    ***************************************************************/
              /*----------------------------------------*/
              /* Show/Create/Edit View Table background */
              /*----------------------------------------*/
    lightForm: "#FFFFFF", // show view background
    lightFormBorder: "#E4E4E7", // show view rows border
    lightFormHeading: "#FAFAFA", // show view heading
    lightFormFieldTextColor: "#18181B",


              /*----------------------------------------*/
              /*            List View Table             */
              /*----------------------------------------*/
    lightListSkeletLoader: "#ECECEE",
    lightList: "#FAFAFA", // list view background
    lightListTable: "#FFFFFF", // list view table background
    lightListTableHeading: "#FFFFFF", // list view table heading
    lightListTableHeadingText: "#3F3F46", // list view table heading text
    lightListTableText: "#3F3F46", // list view table text
    lightListTableRowHover: "#FAFAFA", // list view row hover
    lightListBorder: "#E4E4E7", // list view  rows 

    lightListTablePaginationBackgoround: "#FFFFFF",
    lightListTablePaginationBackgoroundHover: "#F4F4F5",
    lightListTablePaginationBorder: "#D4D4D8",
    lightListTablePaginationFocusRing: "alias:lightPrimary opacity:0.26",
    lightListTablePaginationText: "#3F3F46",
    lightListTablePaginationCurrentPageText: "#18181B",
    lightListTablePaginationTextHover: "#18181B",
    lightListTablePaginationHelpText: "#696973",

    /* ListView buttons */
    lightListViewButtonBackground: "#FFFFFF",
    lightListViewButtonBackgroundHover: "#F3F4F6",
    lightListViewButtonText: "#111827",
    lightListViewButtonTextHover: "alias:lightPrimary",
    lightListViewButtonFocusRing: "#F3F4F6",
    lightListViewButtonBorder: "#D1D5DB",


              /*----------------------------------------*/
              /*            Show View Table             */
              /*----------------------------------------*/
    lightShowTableHeadingBackground: "#FAFAFA",
    lightShowTableHeadingText: "#3F3F46",
    lightShowTableUnderHeadingBackground: "#FAFAFA",
    lightShowTableUnderHeadingText: "#696973",
    lightShowTablesBodyBackground: "alias:lightForm",
    lightShowTableBodyText: "#3F3F46",
    lightShowTableBodyBorder: "#F0F0F2",


    /* Show View buttons*/
    lightShowViewButtonBackground: "#FFFFFF",
    lightShowViewButtonBackgroundHover: "#F3F4F6",
    lightShowViewButtonText: "#111827",
    lightShowViewButtonTextHover: "alias:lightPrimary",
    lightShowViewButtonFocusRing: "#F3F4F6",
    lightShowViewButtonBorder: "#D1D5DB",


              /*----------------------------------------*/
              /*            Create View Table           */
              /*----------------------------------------*/
    /* CreateView buttons */
    lightCreateViewButtonBackground: "#FFFFFF",
    lightCreateViewButtonBackgroundHover: "#F3F4F6",
    lightCreateViewButtonText: "#111827",
    lightCreateViewButtonTextHover: "alias:lightPrimary",
    lightCreateViewButtonFocusRing: "#F3F4F6",
    lightCreateViewButtonBorder: "#D1D5DB",

    lightCreateViewSaveButtonText: "alias:lightButtonsText",
    lightCreateViewSaveButtonTextHover: "alias:lightButtonsText",


              /*----------------------------------------*/
              /*             Edit View Table            */
              /*----------------------------------------*/
    /* EditView buttons */
    lightEditViewButtonBackground: "#FFFFFF",
    lightEditViewButtonBackgroundHover: "#F3F4F6",
    lightEditViewButtonText: "#111827",
    lightEditViewButtonTextHover: "alias:lightPrimary",
    lightEditViewButtonFocusRing: "#F3F4F6",
    lightEditViewButtonBorder: "#D1D5DB",

    lightEditViewSaveButtonText: "alias:lightButtonsText",
    lightEditViewSaveButtonTextHover: "alias:lightButtonsText",  

              /*----------------------------------------*/
              /*            Login View Table            */
              /*----------------------------------------*/
    /* Login View */
    lightLoginViewBackground: "#FFFFFF",
    lightLoginViewTextColor: "#18181B",
    lightLoginViewSubTextColor: "#696973",
    lightLoginViewPromptBackground: "#FAFAFA",
    lightLoginViewPromptText: "#3F3F46",

    /*************************************************************** 
    *                                                              *
    *                  AdminForth light components                 *
    *                                                              *
    ***************************************************************/

    lightButtonsBackground: "#18181B", // button background
    lightButtonsBorder: "#18181B", // button border
    lightButtonsText: "#FFFFFF", // button text
    lightButtonsHover: "#303036", // button hover
    lightButtonsBorderHover: "#303036", // button border hover  
    lightButtonFocusRing: "alias:lightPrimary opacity:0.26", // button focus ring

    lightButtonGroupBackground: "#FFFFFF", // button group background
    lightButtonGroupBorder: "#D4D4D8", // button group border
    lightButtonGroupText: "#3F3F46", // button group text
    lightButtonGroupFocusRing: "alias:lightPrimary opacity:0.26", // button group focus ring
    lightButtonGroupBackgroundHover: "#F4F4F5", // button group background hover
    lightButtonGroupTextHover: "#18181B", // button group text hover
    lightButtonGroupActiveBackground: "#ECECEE", // button group active background
    lightButtonGroupActiveText: "#18181B", // button group active text
    lightButtonGroupActiveFocusRing: "alias:lightPrimary opacity:0.26", // button group active focus ring
    
    lightDropdownButtonsBackground: "#FFFFFF", // dropdown button/input background color
    lightDropownButtonsBorder: "#D4D4D8", //border color
    lightDropdownButtonsText: "#18181B", //text color
    lightDropdownButtonsPlaceholderText: "#A1A1AA", //placeholder text color

    lightDropdownOptionsBackground: "#FFFFFF", //dropdown menu background color
    lightDropdownOptionsHoverBackground: "#F4F4F5", //dropdown menu hover background color
    lightDropdownPicked:"#F4F4F5", //dropdown ,enu picked option
    lightDropdownOptionsText: "#3F3F46", //dropdown menu hover background color
    
    lightDropdownMultipleSelectBackground: "#ECECEE", //if select multiple, selected options background 
    lightDropdownMultipleSelectText: "#18181B", // text color
    lightDropdownMultipleSelectIcon: "#A1A1AA", // delete select icon
    lightDropdownMultipleSelectIconHover: "#696973", // delete select icon color
    lightDropdownMultipleSelectIconFocus: "#696973", // delete select icon focus 
    lightDropdownMultipleSelectIconFocusBackground: "#E4E4E7", // delete select icon focus background


    lightCheckboxBgUnchecked: "#FFFFFF",     //checkbox unchecked state bg
    lightCheckboxBgChecked: "alias:lightPrimary",        //cheched state bg
    lightCheckboxIconColor: "#FFFFFF",       //checked icon color
    lightCheckboxBorderColor: "#D4D4D8",  //border color
    lightFocusRing: "alias:lightPrimary opacity:0.26", //focus ring color
    lightTextLabel: "#18181B", //text color of checkbox label

    lightToggleBgUnactive: "#D4D4D8", //toggle unactive state background
    lightToggleBgActive: "alias:lightPrimary", //toggle active state background
    lightToggleCircleUnactive: "#FFFFFF",
    lightToggleCircleActive: "#FFFFFF",        
    lightToggleRing: "alias:lightPrimary opacity:0.26", // toggle ring color
    lightToggleText: "#18181B",  // color of text next to toggle
    lightToggleBorderUnactive: "#D4D4D8", // unactive state border
    lightToggleBorderActive: "alias:lightPrimary", // active state border

    lightInputBackground: "#FFFFFF",  // input background
    lightInputPlaceholderText: "#A1A1AA", //placeholder text color
    lightInputText: "#18181B", //text color 
    lightInputBorder: "#D4D4D8", //border color 
    lightInputBackgroundHover: "#FFFFFF", //hover
    lightInputTextHover: "#18181B", //text hover
    lightInputBorderHover: "#A1A1AA", //border hover
    lightInputFocusRing: "alias:lightPrimary opacity:0.26", //focus ring
    lightInputFocusBorder: "alias:lightPrimary", 
    lightInputIconColor: "#696973", //input icon
    lightInputErrorColor: "#D92D20", //color of icon and text, when error shown
    lightRequiredIconColor: "#B42318", //requires icon color


    lightDatePickerButtonBackground: "#FFFFFF",
    lightDatePickerButtonText: "#18181B",
    lightDatePickerPlaceHolder: "#A1A1AA",
    lightDatePickerButtonBorder: "#D4D4D8",
    lightDatePickerIcon: "#696973",
    lightDatePickerExpandText: "alias:lightPrimary",

    lightDatePickerCalendarBackground: "#FFFFFF",
    lightDatePickerCalendarText: "#18181B",
    lightDatePickerCalendarArrowButtonBackground: "#FFFFFF",
    lightDatePickerCalendarArrowButtonBackgroundHover: "#F4F4F5",
    lightDatePickerCalendarArrowButtonFocusRing: "#E4E4E7",
    lightDatePickerCalendarDaysOfWeekText: "#696973",
    lightDatePickerCalendarDateButtonText: "#3F3F46",
    lightDatePickerCalendarDateButtonBackgroundHover: "#F4F4F5",
    lightDatePickerCalendarDateActiveButtonBackground: "#18181B",
    lightDatePickerCalendarDateActiveButtonText: "#FFFFFF",


    lightTooltipBackground: "#18181B",
    lightTooltipText: "#FFFFFF",

    lightVerticalTabsText: "#3F3F46",
    lightVerticalTabsTextHover: "#18181B",
    lightVerticalTabsBackground: "#FAFAFA",
    lightVerticalTabsBackgroundHover: "#F4F4F5",
    lightVerticalTabsTextActive: "#18181B",
    lightVerticalTabsBackgroundActive: "#ECECEE",
    lightVerticalTabsSlotText: "#3F3F46",

    lightDialogBackgorund: "#FFFFFF",
    lightDialogBreakLine: "#E4E4E7",
    lightDialogHeaderText: "#18181B",
    lightDialogCloseButton: "#A1A1AA",
    lightDialogCloseButtonHover: "#18181B",
    lightDialogCloseButtonHoverBackground: "#F4F4F5",
    lightDialogBodyText: "#52525B",

    lightDropzoneBackground: "#FAFAFA",
    lightDropzoneBackgroundHover: "#F4F4F5",
    lightDropzoneBorder: "#D4D4D8",
    lightDropzoneBorderHover: "#A1A1AA",
    lightDropzoneBorderDragging: "alias:lightPrimary",
    lightDropzoneBackgroundDragging: "alias:lightPrimary opacity:0.06",
    lightDropzoneIcon: "#696973",
    lightDropzoneText: "#696973",

    lightTableBackground: "#FFFFFF",
    lightTableHeadingText: "#3F3F46",
    lightTableHeadingBackground: "#FFFFFF",
    lightTableBorder: "#E4E4E7",
    lightTableText: "#3F3F46",
    lightTableEvenBackground: "#FAFAFA",
    lightTableOddBackground: "#FFFFFF",
    lightTablePaginationText: "#696973",
    lightTablePaginationNumeration: "#18181B",
    lightTablePaginationInputBackground: "#FFFFFF",
    lightTablePaginationInputBorder: "#D4D4D8",
    lightTablePaginationInputText: "#18181B",
    lightUnactivePaginationButtonBackground: "#FFFFFF",
    lightUnactivePaginationButtonText: "#3F3F46",
    lightUnactivePaginationButtonBorder: "#D4D4D8",
    lightUnactivePaginationButtonHoverBackground: "#F4F4F5",
    lightUnactivePaginationButtonHoverText: "#18181B",
    lightActivePaginationButtonBackground: "#18181B",
    lightActivePaginationButtonText: "#FFFFFF",

    lightProgressBarUnfilledColor: "#ECECEE",
    lightProgressBarFilledColor: "alias:lightPrimary",
    lightProgressBarText: "#696973",

    lightSkeletonBackgroundColor: "#ECECEE",
    lightSkeletonIconColor: "#D4D4D8",

    lightAcceptModalBackground: "#FFFFFF",
    lightAcceptModalCloseIcon: "#A1A1AA",
    lightAcceptModalCloseIconHover: "#18181B",
    lightAcceptModalCloseIconHoverBackground: "#F4F4F5",
    lightAcceptModalWarningIcon: "#B42318",
    lightAcceptModalText: "#52525B",
    lightAcceptModalConfirmButtonBackground: "#D92D20",
    lightAcceptModalConfirmButtonBackgroundHover: "#B42318",
    lightAcceptModalConfirmButtonText: "#FFFFFF",
    lightAcceptModalConfirmButtonFocus: "#FECDCA",
    lightAcceptModalCancelButtonBackground: "#FFFFFF",
    lightAcceptModalCancelButtonBackgroundHover: "#F4F4F5",
    lightAcceptModalCancelButtonText: "#18181B",
    lightAcceptModalCancelButtonFocus: "#E4E4E7",
    lightAcceptModalCancelButtonBorder: "#D4D4D8",

    lightBreadcrumbsHomepageText: "#696973",
    lightBreadcrumbsHomepageTextHover: "#18181B",
    lightBreadcrumbsArrowIcon: "#A1A1AA",
    lightBreadcrumbsText: "#18181B",

    lightRangePickerButtonBackground: "#FFFFFF",
    lightRangePickerButtonBackgroundHover: "#F4F4F5",
    lightRangePickerButtonBorder: "#D4D4D8",
    lightRangePickerButtonText: "#18181B",
    lightRangePickerButtonTextHover: "#18181B",
    lightRangePickerFocusRing: "alias:lightPrimary opacity:0.26",
    lightRangePickerInputBackground: "#FFFFFF",
    lightRangePickerInputBorder: "#D4D4D8",
    lightRangePickerInputText: "#18181B",
    lightRangePickerInputPlaceholder: "#A1A1AA",

    lightFiltersBackgroung: "#FFFFFF",
    lightFiltersHeaderText: "#18181B",
    lightFiltersCloseIcon: "#696973",
    lightFiltersCloseIconHover: "#18181B",
    lightFiltersCloseIconHoverBackground: "#F4F4F5",
    lightFiltersClearAllButtonBackground: "#FFFFFF",
    lightFiltersClearAllButtonBackgroundHover: "#F4F4F5",
    lightFiltersClearAllButtonBorder: "#D4D4D8",
    lightFiltersClearAllButtonText: "#18181B",
    lightFiltersClearAllButtonTextHover: "#18181B",
    lightFiltersClearAllButtonFocus: "#E4E4E7",

    lightThreeDotsMenuIconBackground: "#FFFFFF",
    lightThreeDotsMenuIconBackgroundHover: "#F4F4F5",
    lightThreeDotsMenuIconBackgroundBorder: "#D4D4D8",
    lightThreeDotsMenuIconDots: "#3F3F46",
    lightThreeDotsMenuIconDotsHover: "#18181B",   
    lightThreeDotsMenuIconFocus: "#E4E4E7",   
    lightThreeDotsMenuBodyBackground: "#FFFFFF",
    lightThreeDotsMenuBodyBackgroundHover: "#F4F4F5",
    lightThreeDotsMenuBodyText: "#3F3F46",
    lightThreeDotsMenuBodyTextHover: "#18181B",

    lightToastBackground: "#FFFFFF",
    lightToastCloseIcon: "#A1A1AA",
    lightToastCloseIconHover: "#18181B",
    lightToastCloseIconBackground: "#FFFFFF",
    lightToastCloseIconBackgroundHover: "#F4F4F5",
    lightToastCloseIconFocusRing: "#E4E4E7",
    lightToastText: "#3F3F46",

    lightCardBackground: "#FFFFFF",
    lightCardBackgroundHover: "#FAFAFA",
    lightCardBorder: "#E4E4E7",
    lightCardTitle: "#18181B",
    lightCardDescription: "#696973",

    lightUserMenuBackground: "#FFFFFF",
    lightUserMenuBorder: "#F0F0F2",
    lightUserMenuText: "#18181B",
    lightUserMenuItemBackground: "alias:lightUserMenuBackground",
    lightUserMenuItemBackgroundHover: "#F4F4F5",
    lightUserMenuItemText: "#18181B",
    lightUserMenuItemTextHover: "#18181B",

    // colors for dark theme
    darkHtml: "#0D0D0F",

    darkPrimary: "rgb(130 172 255)", // primary color
    darkPrimaryContrast: "alias:darkPrimary inverse", // primary color contrast
    darkPrimaryOpacity: "alias:darkPrimary opacity:0.2", // primary color opacity

    darkSecondary: "#151517", // secondary color
    darkSecondaryLighten: "#1D1D20",
    darkSecondaryContrast: "alias:darkSecondary inverse", // secondary color contrast

    darkSuccess: "#6EE7A8",
    darkSuccessSoft: "#0F2419",
    darkSuccessBorder: "#1D4A31",
    darkWarning: "#FBC86A",
    darkWarningSoft: "#2A1F0B",
    darkWarningBorder: "#5A4211",
    darkDanger: "#FF9592",
    darkDangerSoft: "#2B1416",
    darkDangerBorder: "#5E2125",


    darkNavbar: "#0D0D0F", 
    darkNavbarBorder: "#29292E",
    darkNavbarText: "#D4D4D8",
    darkNavbarTextHover: "alias:darkNavbarText lighten",
    darkNavbarTextActive: "alias:darkNavbarText lighten",
    darkNavbarIcons: "alias:darkNavbarText opacity:0.7",
    darkAnnouncementText: "alias:darkPrimaryContrast",
    darkAnnouncementBG: "alias:darkPrimary",

    darkSidebar: "#0D0D0F", 
    darkSidebarBorder: "alias:darkSidebarText opacity:0.12", 
    darkSidebarItemHover: "alias:darkSidebarText opacity:0.06", 
    darkSidebarItemActive: "alias:darkSidebarText opacity:0.11", 
    darkSidebarText: "#D4D4D8", 
    darkSidebarTextHover: "alias:darkSidebarText lighten", 
    darkSidebarTextActive: "alias:darkSidebarText lighten", 
    darkSidebarDevider: "alias:darkSidebarText opacity:0.12", 
    darkSidebarIcons: "alias:darkSidebarText opacity:0.7", 
    darkSidebarIconsHover: "alias:darkSidebarText", 
    darkSidebarHeading: "alias:darkSidebarText opacity:0.55", 

    /*************************************************************** 
    *                                                              *
    *                          Dark Views                          *
    *                                                              *
    ***************************************************************/
              /*----------------------------------------*/
              /* Show/Create/Edit View Table background */
              /*----------------------------------------*/
    darkForm: "#151517", 
    darkFormBorder: "#29292E", 
    darkFormHeading: "#18181B",
    darkFormFieldTextColor: "#F4F4F5",
    

              /*----------------------------------------*/
              /*            List View Table             */
              /*----------------------------------------*/
    darkListSkeletLoader: "#27272B",
    darkList: "#0D0D0F", 
    darkListTable: "#151517", 
    darkListTableHeading: "#151517", 
    darkListTableHeadingText: "#D4D4D8",
    darkListTableText: "#D4D4D8", 
    darkListTableRowHover: "#1A1A1D",
    darkListBorder: "#29292E",

    darkListTablePaginationBackgoround: "#151517",
    darkListTablePaginationBackgoroundHover: "#1D1D20",
    darkListTablePaginationBorder: "#3A3A41",
    darkListTablePaginationFocusRing: "alias:darkPrimary opacity:0.45",
    darkListTablePaginationText: "#D4D4D8",
    darkListTablePaginationCurrentPageText: "#F4F4F5",
    darkListTablePaginationTextHover: "#FFFFFF",
    darkListTablePaginationHelpText: "#A1A1AA", 

    /* ListView buttons */
    darkListViewButtonBackground: "#1F2937",
    darkListViewButtonBackgroundHover: "#374151",
    darkListViewButtonText: "#9CA3AF",
    darkListViewButtonTextHover: "#FFFFFF",
    darkListViewButtonFocusRing: "#374151",
    darkListViewButtonBorder: "#4B5563",

              /*----------------------------------------*/
              /*            Show View Table             */
              /*----------------------------------------*/
    darkShowTableHeadingBackground: "alias:darkFormHeading",
    darkShowTableHeadingText: "#D4D4D8",
    darkShowTableUnderHeadingBackground: "alias:darkFormHeading",
    darkShowTableUnderHeadingText: "#A1A1AA",
    darkShowTablesBodyBackground: "alias:darkForm",
    darkShowTableBodyText: "#D4D4D8",
    darkShowTableBodyBorder: "#202024",

        /* Show View buttons*/
    darkShowViewButtonBackground: "#1F2937",
    darkShowViewButtonBackgroundHover: "#374151",
    darkShowViewButtonText: "#9CA3AF",
    darkShowViewButtonTextHover: "#FFFFFF",
    darkShowViewButtonFocusRing: "#374151",
    darkShowViewButtonBorder: "#4B5563",
              /*----------------------------------------*/
              /*            Create View Table           */
              /*----------------------------------------*/
    /* CreateView buttons */
    darkCreateViewButtonBackground: "#1F2937",
    darkCreateViewButtonBackgroundHover: "#374151",
    darkCreateViewButtonText: "#9CA3AF",
    darkCreateViewButtonTextHover: "#FFFFFF",
    darkCreateViewButtonFocusRing: "#374151",
    darkCreateViewButtonBorder: "#4B5563",

    darkCreateViewSaveButtonText: "alias:darkButtonsText",
    darkCreateViewSaveButtonTextHover: "alias:darkButtonsText",


              /*----------------------------------------*/
              /*             Edit View Table            */
              /*----------------------------------------*/
    /* EditView buttons */
    darkEditViewButtonBackground: "#1F2937",
    darkEditViewButtonBackgroundHover: "#374151",
    darkEditViewButtonText: "#9CA3AF",
    darkEditViewButtonTextHover: "#FFFFFF",
    darkEditViewButtonFocusRing: "#374151",
    darkEditViewButtonBorder: "#4B5563",

    darkEditViewSaveButtonText: "alias:darkButtonsText",
    darkEditViewSaveButtonTextHover: "alias:darkButtonsText",


              /*----------------------------------------*/
              /*             Login View Table           */
              /*----------------------------------------*/
    /* Login view */
    darkLoginViewBackground: "#151517",
    darkLoginViewTextColor: "#F4F4F5",
    darkLoginViewSubTextColor: "#A1A1AA",
    darkLoginViewPromptBackground: "#1D1D20",
    darkLoginViewPromptText: "#D4D4D8",


    /*************************************************************** 
    *                                                              *
    *                  AdminForth dark components                  *
    *                                                              *
    ***************************************************************/
    darkButtonsBackground: "#F4F4F5", // button background
    darkButtonsBorder: "#F4F4F5", // button border
    darkButtonsText: "#18181B", // button text
    darkButtonsHover: "#FFFFFF", // button hover
    darkButtonsBorderHover: "#FFFFFF", // button border hover
    darkButtonFocusRing: "alias:darkPrimary opacity:0.45", // button focus ring

    darkButtonGroupBackground: "#151517", // button group background
    darkButtonGroupBorder: "#3A3A41", // button group border
    darkButtonGroupText: "#D4D4D8", // button group text
    darkButtonGroupFocusRing: "alias:darkPrimary opacity:0.45", // button group focus ring
    darkButtonGroupBackgroundHover: "#1D1D20", // button group background hover
    darkButtonGroupTextHover: "#FFFFFF", // button group text hover
    darkButtonGroupActiveBackground: "#27272B", // button group active background
    darkButtonGroupActiveText: "#FFFFFF", // button group active text
    darkButtonGroupActiveFocusRing: "alias:darkPrimary opacity:0.45", // button group active focus ring

    darkDropdownButtonsBackground: "#151517",
    darkDropdownButtonsBorder: "#3A3A41",
    darkDropdownButtonsText: "#F4F4F5",
    darkDropdownButtonsPlaceholderText: "#6B6B74",
    darkDropdownOptionsBackground: "#1D1D20",
    darkDropdownOptionsHoverBackground: "#27272B",
    darkDropdownPicked:"#27272B",
    darkDropdownOptionsText: "#D4D4D8",

    darkDropdownMultipleSelectBackground: "#27272B",
    darkDropdownMultipleSelectText: "#F4F4F5",
    darkDropdownMultipleSelectIcon: "#A1A1AA",
    darkDropdownMultipleSelectIconHover: "#D4D4D8",
    darkDropdownMultipleSelectIconFocus: "#D4D4D8",
    darkDropdownMultipleSelectIconFocusBackground: "#3A3A41",

    darkCheckboxBgUnchecked: "#151517",   
    darkCheckboxBgChecked: "alias:darkPrimary",      
    darkCheckboxIconColor: "#FFFFFF",    
    darkCheckboxBorderColor: "#3A3A41",  
    darkFocusRing: "alias:darkPrimary opacity:0.45",
    darkTextLabel: "#F4F4F5",

    darkToggleBgUnactive: "#3A3A41",
    darkToggleBgActive: "alias:darkPrimary",
    darkToggleCircleUnactive: "#FFFFFF",
    darkToggleCircleActive: "#FFFFFF",    
    darkToggleRing: "alias:darkPrimary opacity:0.45",
    darkToggleText: "#F4F4F5", 
    darkToggleBorderUnactive: "#3A3A41",
    darkToggleBorderActive: "alias:darkPrimary",

    darkInputBackground: "#151517",
    darkInputPlaceholderText: "#6B6B74",
    darkInputText: "#F4F4F5",
    darkInputBorder: "#3A3A41",
    darkInputHover: "#151517",
    darkInputTextHover: "#F4F4F5",
    darkInputBorderHover: "#52525B",
    darkInputFocusRing: "alias:darkPrimary opacity:0.45",
    darkInputFocusBorder: "alias:darkPrimary", 
    darkInputIconColor: "#A1A1AA",
    darkInputErrorColor: "#F97066",
    darkRequiredIconColor: "#F97066",


    darkDatePickerButtonBackground: "#151517",
    darkDatePickerButtonText: "#F4F4F5",
    darkDatePickerPlaceHolder: "#6B6B74",
    darkDatePickerButtonBorder: "#3A3A41",
    darkDatePickerIcon: "#A1A1AA",
    darkDatePickerExpandText: "alias:darkPrimary",

    darkDatePickerCalendarBackground: "#1D1D20",
    darkDatePickerCalendarMainText: "#F4F4F5",
    darkDatePickerCalendarArrowButtonBackground: "#1D1D20",
    darkDatePickerCalendarArrowButtonBackgroundHover: "#27272B",
    darkDatePickerCalendarArrowButtonFocusRing: "#3A3A41",
    darkDatePickerCalendarDaysOfWeekText: "#A1A1AA",
    darkDatePickerCalendarDateButtonText: "#D4D4D8",
    darkDatePickerCalendarDateActiveButtonBackground: "#F4F4F5",
    darkDatePickerCalendarDateButtonBackgroundHover: "#27272B",
    darkDatePickerCalendarDateActiveButtonText: "#18181B",



    darkTooltipBackground: "#F4F4F5",
    darkTooltipText: "#18181B",

    darkVerticalTabsText: "#A1A1AA",
    darkVerticalTabsTextHover: "#F4F4F5",
    darkVerticalTabsBackground: "#121214",
    darkVerticalTabsBackgroundHover: "#1D1D20",
    darkVerticalTabsTextActive: "#FFFFFF",
    darkVerticalTabsBackgroundActive: "#27272B",
    darkVerticalTabsSlotText: "#D4D4D8",

    darkDialogBackgorund: "#151517",
    darkDialogBreakLine: "#29292E",
    darkDialogHeaderText: "#F4F4F5",
    darkDialogCloseButton: "#9CA3AF",
    darkDialogCloseButtonHover: "#FFFFFF",
    darkDialogCloseButtonHoverBackground: "#27272B",
    darkDialogBodyText: "#A1A1AA",

    darkDropzoneBackground: "#121214",
    darkDropzoneBackgroundHover: "#1D1D20",
    darkDropzoneBackgroundDragging: "alias:darkPrimary opacity:0.12",
    darkDropzoneBorder: "#3A3A41",
    darkDropzoneBorderHover: "#52525B",
    darkDropzoneBorderDragging: "alias:darkPrimary",
    darkDropzoneIcon: "#A1A1AA",
    darkDropzoneText: "#A1A1AA",

    darkTableBackground: "#151517",
    darkTableHeadingText: "#D4D4D8",
    darkTableHeadingBackground: "#151517",
    darkTableBorder: "#29292E",
    darkTableText: "#D4D4D8",
    darkTableEvenBackground: "#18181B",
    darkTableOddBackground: "#151517",
    darkTablePaginationText: "#A1A1AA",
    darkTablePaginationNumeration: "#F4F4F5",
    darkTablePaginationInputBackground: "#151517",
    darkTablePaginationInputBorder: "#3A3A41",
    darkTablePaginationInputText: "#F4F4F5",
    darkUnactivePaginationButtonBackground: "#151517",
    darkUnactivePaginationButtonText: "#D4D4D8",
    darkUnactivePaginationButtonBorder: "#3A3A41",
    darkUnactivePaginationButtonHoverBackground: "#1D1D20",
    darkUnactivePaginationButtonHoverText: "#FFFFFF",
    darkActivePaginationButtonBackground: "#F4F4F5",
    darkActivePaginationButtonText: "#18181B",

    darkProgressBarUnfilledColor: "#27272B",
    darkProgressBarFilledColor: "alias:darkPrimary",
    darkProgressBarText: "#A1A1AA",

    darkSkeletonBackgroundColor: "#27272B",
    darkSkeletonIconColor:"#3A3A41",

    darkAcceptModalBackground: "#151517",
    darkAcceptModalCloseIcon: "#9CA3AF",
    darkAcceptModalCloseIconHover: "#FFFFFF",
    darkAcceptModalCloseIconHoverBackground: "#27272B",
    darkAcceptModalWarningIcon: "#F97066",
    darkAcceptModalText: "#A1A1AA",
    darkAcceptModalConfirmButtonBackground: "#E5484D",
    darkAcceptModalConfirmButtonBackgroundHover: "#D13A40",
    darkAcceptModalConfirmButtonText: "#FFFFFF",
    darkAcceptModalConfirmButtonFocus: "#5E2125",
    darkAcceptModalCancelButtonBackground: "#151517",
    darkAcceptModalCancelButtonBackgroundHover: "#1D1D20",
    darkAcceptModalCancelButtonText: "#F4F4F5",
    darkAcceptModalCancelButtonTextHover: "#FFFFFF",
    darkAcceptModalCancelButtonFocus: "#27272B",
    darkAcceptModalCancelButtonBorder: "#3A3A41",

    darkBreadcrumbsHomepageText: "#A1A1AA",
    darkBreadcrumbsHomepageTextHover: "#FFFFFF",
    darkBreadcrumbsArrowIcon: "#6B6B74",
    darkBreadcrumbsText: "#F4F4F5",

    darkRangePickerButtonBackground: "#151517",
    darkRangePickerButtonBackgroundHover: "#1D1D20",
    darkRangePickerButtonBorder: "#3A3A41",
    darkRangePickerButtonText: "#D4D4D8",
    darkRangePickerButtonTextHover: "#FFFFFF",
    darkRangePickerFocusRing: "alias:darkPrimary opacity:0.45",
    darkRangePickerInputBackground: "#151517",
    darkRangePickerInputBorder: "#3A3A41",
    darkRangePickerInputText: "#F4F4F5",
    darkRangePickerInputPlaceholder: "#6B6B74",

    darkFiltersBackgroung: "#151517",
    darkFiltersHeaderText: "#F4F4F5",
    darkFiltersCloseIcon: "#A1A1AA",
    darkFiltersCloseIconHover: "#FFFFFF",
    darkFiltersCloseIconHoverBackground: "#27272B",
    darkFiltersClearAllButtonBackground: "#151517",
    darkFiltersClearAllButtonBackgroundHover: "#1D1D20",
    darkFiltersClearAllButtonBorder: "#3A3A41",
    darkFiltersClearAllButtonText: "#D4D4D8",
    darkFiltersClearAllButtonTextHover: "#FFFFFF",
    darkFiltersClearAllButtonFocus: "#27272B",

    darkThreeDotsMenuIconBackground: "#151517",
    darkThreeDotsMenuIconBackgroundHover: "#1D1D20",
    darkThreeDotsMenuIconBackgroundBorder: "#3A3A41",
    darkThreeDotsMenuIconDots: "#D4D4D8",
    darkThreeDotsMenuIconDotsHover: "#FFFFFF",   
    darkThreeDotsMenuIconFocus: "#27272B",   
    darkThreeDotsMenuBodyBackground: "#1D1D20",
    darkThreeDotsMenuBodyBackgroundHover: "#27272B",
    darkThreeDotsMenuBodyText: "#D4D4D8",
    darkThreeDotsMenuBodyTextHover: "#FFFFFF",

    darkToastBackground: "#1D1D20",
    darkToastCloseIcon: "#A1A1AA",
    darkToastCloseIconHover: "#FFFFFF",
    darkToastCloseIconBackground: "#1D1D20",
    darkToastCloseIconBackgroundHover: "#27272B",
    darkToastCloseIconFocusRing: "#3A3A41",
    darkToastText: "#D4D4D8",

    darkCardBackground: "#151517", // card background
    darkCardBackgroundHover: "#1D1D20", // card background hover
    darkCardBorder: "#29292E", // card border
    darkCardTitle: "#F4F4F5", // card title
    darkCardDescription: "#A1A1AA", // card description

    darkUserMenuBackground: "#1D1D20",
    darkUserMenuBorder: "#29292E",
    darkUserMenuText: "#F4F4F5",
    darkUserMenuItemBackground: "alias:darkUserMenuBackground",
    darkUserMenuItemBackgroundHover: "#27272B",
    darkUserMenuItemText: "#F4F4F5",
    darkUserMenuItemTextHover: "#FFFFFF",

  },
  boxShadow: {
    customLight: "0 1px 1px rgba(24, 24, 27, 0.05)", // controls: inputs, secondary buttons
    headerShadow: "none",
    listTableShadow: "none", // tables and forms are drawn with 1px borders instead of shadows
    darkListTableShadow: "none",
    resourseFormShadow: "none",
    darkResourseFormShadow: "none",
    popover: "0 0 0 1px rgba(24, 24, 27, 0.07), 0 12px 32px -10px rgba(24, 24, 27, 0.22), 0 2px 6px -2px rgba(24, 24, 27, 0.08)", // menus, dropdowns, dialogs, toasts
    darkPopover: "0 0 0 1px rgba(255, 255, 255, 0.07), 0 16px 40px -10px rgba(0, 0, 0, 0.7)",
  },
  fontSize: {
    "headerText-size": "1rem"
  },
  fontFamily: {
    sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"'],
    mono: ['"Geist Mono Variable"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  },
  borderRadius: {
    "default": ".375rem"
  }
});

