

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

    lightList: "#FFFFFF", // list view background
    lightListTable: "#FFFFFF", // list view table background
    lightListTableHeading: "#f5f5f8", // list view table heading
    lightListTableHeadingText: "alias:lightListTableHeading inverse", // list view table heading text
    lightListTableText: "#333333", // list view table text
    lightListTableRowHover: "rgb(249 250 251)", // list view row hover
    lightListBreadcrumbsText: "#666666", // list view breadcrumbs text
    lightListBorder: "#DDDDDD", // list view  rows border
    // lightListButton: "#FFFFFF", // list view button
    // lightListButtonBorder: "#d1d5db", // list view button border
    // lightListButtonHover: "#f3f4f6", // list view button hover
    // lightListButtonBorderHover: "#f3f4f6", // list view button border hover
    // lightListButtonActive: "#f3f4f6", // list view button active
    // lightListButtonDisabled: "#f3f4f6", // list view button disabled
    // lightListButtonDisabledText: "#f3f4f6", // list view button disabled text
    // lightListButtonIcon: "#333333", // list view button icon

    lightForm: "#FFFFFF", // show view background
    lightFormBorder: "#F5F5F5", // show view rows border
    lightFormHeading: "alias:lightListTableHeading", // show view heading

    lightButtons: "#FFFFFF", // button background
    lightButtonsBorder: "#DDDDDD", // button border
    lightButtonsText: "#111827", // button text
    lightButtonsHover: "#f3f4f6", // button hover
    lightButtonsBorderHover: "#f3f4f6", // button border hover  
    lightButtonsActive: "#f3f4f6", // button active
    lightButtonsDisabled: "#f3f4f6", // button disabled
    lightButtonsDisabledText: "#f3f4f6", // button disabled text
    lightButtonsIcon: "#333333", // button icon
    


    // colors for dark theme
    darkHtml: "#111827",

    darkPrimary: "rgb(130 172 255)", // primary color
    darkPrimaryContrast: "alias:darkPrimary inverse", // primary color contrast
    darkPrimaryOpacity: "#212A40", // primary color opacity

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


    darkList: "#111111", 
    darkListTable: "#1f2937", 
    darkListTableHeading: "#334155", 
    darkListTableHeadingText: "#9ca3af",
    darkListTableText: "#9ca3af", 
    darkListTableRowHover: "rgb(35 47 65)",
    darkListBreadcrumbsText: "#BBBBBB", 
    darkListBorder: "#444444", 

    darkForm: "#111111", 
    darkFormBorder: "#222222", 
    darkFormHeading: "alias:darkListTableHeading" 

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



