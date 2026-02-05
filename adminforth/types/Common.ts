/**
 * Types that are common for both frontend side (SPA) and backend side (server).
 */

export enum AdminForthDataTypes {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  TEXT = 'text',
  JSON = 'json',
}

export enum AdminForthFilterOperators {
  EQ = 'eq',
  NE = 'ne',
  GT = 'gt',
  LT = 'lt',
  GTE = 'gte',
  LTE = 'lte',
  LIKE = 'like',
  ILIKE = 'ilike',
  IN = 'in',
  NIN = 'nin',
  AND = 'and',
  OR = 'or',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
};

export type FilterParams = {
    /**
     * Field of resource to filter
     */
    field: string;
    /**
     * Operator of filter
     */
    operator: AdminForthFilterOperators;
    /**
     * Value of filter
     */
    value: string | number | boolean ;
} 

export enum AdminForthSortDirections {
  asc = 'asc',
  desc = 'desc',
};


export interface AdminForthColumnEnumItem {
    value: any | null,
    label: string,
}

export enum ActionCheckSource {
  DisplayButtons = 'displayButtons',
  ListRequest = 'listRequest',
  ShowRequest = 'showRequest',
  EditLoadRequest = 'editLoadRequest',  // when data for edit page is loaded
  EditRequest = 'editRequest',
  CreateRequest = 'createRequest',
  DeleteRequest = 'deleteRequest',
  BulkActionRequest = 'bulkActionRequest',
  CustomActionRequest = 'customActionRequest',
}

export enum AllowedActionsEnum {
  show = 'show',
  list = 'list',
  edit = 'edit',
  create = 'create',
  delete = 'delete',
  filter = 'filter',
}


export type AllowedActionsResolved = {
  [key in AllowedActionsEnum]: boolean
}

// conditional operators for predicates
type Value = any;
type Operators = { $eq: Value } | { $not: Value } | { $gt: Value } | { $gte: Value } | { $lt: Value } | { $lte: Value } | { $in: Value[] } | { $nin: Value[] } | { $includes: Value } | { $nincludes: Value };
export type Predicate = { $and: Predicate[] } | { $or: Predicate[] } | { [key: string]: Operators | Value };

export interface AdminUser {
  /**
   * primaryKey field value of user in table which is defined by {@link AdminForthConfig.auth.usersResourceId}
   */
  pk: string | null,

  /**
   * Username which taken from {@link AdminForthConfig.auth.usernameField} field in user resource {@link AdminForthConfig.auth.usersResourceId}
   */
  username: string,

  /**
   * User record fetched from database, from resource defined in {@link AdminForthConfig.auth.usersResourceId}
   */
  dbUser: any,

  /**
   * Flag which indicates that this user is not real user from database, but external user from e.g. custom website.
   * True here is not possible in AdminForth built-in functions, auth middleware etc. 
   * True value is only possible in your need to tell AdminForth that this is not real "fake" admin user
   */
  isExternalUser?: boolean,
}


export interface AdminForthBulkActionCommon {
  id?: string,

  /**
   * Label for action button which will be displayed in the list view
   */
  label: string,

  /**
   * Add custom class
   **/ 
  buttonCustomCssClass?: string;

  /** 
   * Optional small badge for button which will be displayed in the list view
   */
  badge?: string,

  /**
   * Icon for action button which will be displayed in the list view
   */
  icon?: string,

  /**
   * Confirmation message which will be displayed to user before action is executed.
   */
  confirm?: string,

  /**
   * Success message which will be displayed to user after action is executed.
   */
  successMessage?: string,

  /**
   * Show in three dots dropdown menu in list view.
   */
  showInThreeDotsDropdown?: boolean,
}

export interface AdminForthFieldComponents {
  /**
   * Show component is used to redefine cell which renders field value in show view.
   * Component accepts next properties: [record, column, resource, adminUser, meta].
   * 
   * Example: `FullName.vue`
   * 
   * ```html
   * <template>
   *   {{ record.firstName }} {{ record.lastName }}
   * </template>
   * 
   * <script setup>
   * defineProps(['record']);
   * </script>
   * 
   * ```ts
   * {
   *  label: 'Full Name',
   *  virtual: true,
   *  showIn: {
   *    [AdminForthResourcePages.edit]: false,
   *    [AdminForthResourcePages.create]: false,
   *    [AdminForthResourcePages.filter]: false,
   *  },
   *  components: {
   *   show: '@@/FullName.vue',
   *   list: '@@/FullName.vue',
   *  },
   * }
   * ```
   * 
   */
  show?: AdminForthComponentDeclaration,

  /**
   * showRow component is similar to {@link AdminForthFieldComponent.show} but rewrites full table row (both \<td\> tags)
   * Accepts next properties: [record, column, resource, adminUser]
   */
  showRow?: AdminForthComponentDeclaration, 

  /**
   * Create component is used to redefine input field in create view.
   * Component accepts next properties: [record, column, resource, adminUser].
   */
  create?: AdminForthComponentDeclaration,

  /**
   * Edit component is used to redefine input field in edit view.
   * Component accepts next properties: [record, column, resource, adminUser].
   */
  edit?: AdminForthComponentDeclaration,

  /**
   * List component is used to redefine cell which renders field value in list view.
   * Component accepts next properties: [record, column, resource, adminUser].
   * Component can emit events:
   * - `update:value` - to update record value.
   * - `update:inValidity` - emit true once entered value became not valid (e.g. emit('update:inValidity', true) ). Emit false once entered value became valid. Emit default value in mounted hook.
   * - `update:emptiness` - emit true once entered value became empty (e.g. emit('update:emptiness', true) ). Emit false once entered value became not empty. Emit default value in mounted hook.
   * emptiness emit is optional and required for complex cases. For example for virtual columns where initial value is not set.
   */
  list?: AdminForthComponentDeclaration,

  /**
   * Filter component is used to redefine input field in filter view.
   * Component accepts next properties: [record, column, resource, adminUser].
   */
  filter?: AdminForthComponentDeclaration,
}


export interface AdminForthComponentDeclarationFull {
  /**
   * Path to custom component which will be used to render field in the admin panel.
   * e.g. `@@/MyCustomComponent.vue`
   */
  file : string,

  /**
   * Optional Meta object which will be passed to custom component as props. For example used by plugins
   * to pass plugin options to custom components.
   * 
   * Example:
   * 
   * ```ts
   * {
   *    name: 'Country Flag',
   *    virtual: true,
   *    showIn: {
   *      [AdminForthResourcePages.list]: false,
   *      [AdminForthResourcePages.edit]: false,
   *      [AdminForthResourcePages.create]: false,
   *      [AdminForthResourcePages.filter]: false,
   *    },
   *    components: {
   *      show: {
   *        file: '@@/Flag.vue',
   *        meta: {
   *          flagType: 'country',
   *        },
   *      },
   *    },
   * },
   * {
   *    name: 'Team Flag',
   *    virtual: true,
   *    showIn: {
   *      [AdminForthResourcePages.list]: false,
   *      [AdminForthResourcePages.edit]: false,
   *      [AdminForthResourcePages.create]: false,
   *      [AdminForthResourcePages.filter]: false,
   *    },
   *    components: {
   *      show: {
   *        file: '@@/Flag.vue',
   *        meta: {
   *          flagType: 'team',
   *        },
   *     },
   *    },
   * }
   * ```
   * 
   * In Flag.vue you can access this meta object like this:
   * 
   * ```html
   * <template>
   *  <img :src="loadFile(`@@/flags/${meta.flagType}/${meta.flagType === 'country' ? record.countryIso : record.teamCode}.png`)" />
   * </template>
   * 
   * <script setup>
   * import { loadFile } from '@/utils';
   * defineProps(['meta', 'record']);
   * </script>
   * 
   */
  meta?: {
    /**
     * Controls sidebar and header visibility for custom pages
     * - 'default': Show both sidebar and header (default behavior)
     * - 'none': Hide both sidebar and header (full custom layout)
     * - 'preferIconOnly': Show header but prefer icon-only sidebar
     * - 'headerOnly': Show only header (full custom layout)
     */
    sidebarAndHeader?: 'default' | 'none' | 'preferIconOnly' | 'headerOnly',
    
    [key: string]: any,
  }
}
import { type AdminForthActionInput, type AdminForthResource } from './Back.js' 
export { type AdminForthActionInput } from './Back.js'

export type AdminForthComponentDeclaration = AdminForthComponentDeclarationFull | string;

export type FieldGroup = {
  groupName: string;
  columns: string[];
  noTitle?: boolean;
};

/**
 * Resource describes one table or collection in database.
 * AdminForth generates set of pages for 'list', 'show', 'edit', 'create', 'filter' operations for each resource.
 */
export interface AdminForthResourceInputCommon {
    /**
     * Unique identifier of resource. By default it equals to table name in database. 
     * If you wish you can explicitly set it to any string.
     * We added to support cases when 2 datasources have tables with the same name.
     */
    resourceId?: string,

    /**
     * Label for resource which will be displayed in the admin panel.
     * By default it equals to table name in database.
     */
    label?: string,

    /**
     * Table name in database which will be used to fetch data from. Might be case sensitive.
     */
    table: string,

    /**
     * ID of datasource which will be used to fetch data from.
     */
    dataSource: string,

    /**
     * Array of columns which will be displayed in the admin panel.
     * Each column has its own configuration.
     */
    columns: Array<AdminForthResourceColumnInputCommon>,

    /**
     * Hook which allow you to modify record label
     * 
     * Example:
     * 
     * ```ts
     * recordLabel: (record) => `${record.name} - ${record.id}`,
     * ```
     * 
     */
    recordLabel?: (item: any) => string,


    /**
     * General options for resource.
     */
    options?: {

      /**
       * Default sort for list view.
       * Example:
       * 
       * ```ts
       * import { AdminForthSortDirections } from 'adminforth';
       * 
       * ...
       * 
       * defaultSort: {
       *   columnName: 'created_at',
       *   direction: AdminForthSortDirections.ASC, 
       * }
       * ```
       * 
       */
      defaultSort?: {

        /**
         * Column name which will be used to sort records.
         */
        columnName: string,

        /**
         * Direction of sorting. Can be 'asc' or 'desc'.
         */
        direction: AdminForthSortDirections | string,
      }

      /*
       * Custom actions list. Actions available in show, edit and create views. 
       */
      actions?: AdminForthActionInput[],
      
      /** 
       * Custom bulk actions list. Bulk actions available in list view when user selects multiple records by
       * using checkboxes.
       */
      bulkActions?: AdminForthBulkActionCommon[],

      /**
       * Allowed actions for resource.
       * 
       * Example: 
       * 
       * ```ts
       * allowedActions: {
       *  create: ({ resource, adminUser }) => {
       *    // Allow only superadmin to create records
       *    return adminUser.dbUser.role === 'superadmin';
       *  },
       *  delete: false, // disable delete action for all users
       * }
       * ```
       * 
       */
      allowedActions?: AllowedActionsResolved,

      /** 
       * Allows to make groups of columns in show, create and edit resource pages.
       */
      fieldGroups?: FieldGroup[];
      createFieldGroups?: FieldGroup[];
      editFieldGroups?: FieldGroup[];
      showFieldGroups?: FieldGroup[];

      /** 
       * Page size for list view
       */
      listPageSize?: number,
      
      /**
       * Whether to use virtual scroll in list view.
       */
      listVirtualScrollEnabled?: boolean,

      /**
       * Buffer size for virtual scroll in list view.
       */
      listBufferSize?: number,

      /**
       * Callback to define what happens when user clicks on record in list view.
       * By default show view will be opened.
       * If you wish to open custom page, return URL to the custom page (can start with https://, or relative adminforth path)
       * If you wish to open page in new tab, add `target=_blank` get param to returned URL, example:
       * 
       * ```ts
       * listTableClickUrl: async (record, adminUser, resource) => {
       *   return `https://google.com/search?q=${record.name}&target=_blank`;
       * }
       * ```
       * 
       * If you wish to do nothing on click, return null.
       * 
       * Example:
       * 
       * ```ts
       * listTableClickUrl: async (record, adminUser, resource) => {
       *   return null;
       * }
       * ```
       * 
       * @param record - record which was clicked
       * @param adminUser - user who clicked
       * @returns 
       */
      listTableClickUrl?: (record: any, adminUser: AdminUser, resource: AdminForthResource) => Promise<string | null>,

      /**
       * Whether to refresh existing list rows automatically every N seconds.
       */
      listRowsAutoRefreshSeconds?: number, 

      /** 
       * Custom components which can be injected into AdminForth CRUD pages.
       * Each injection is a path to a custom component which will be displayed in the admin panel.
       * Can be also array to render multiple injections one after another.
       * 
       * Example:
       * 
       * ```ts
       * pageInjections: {
       *  list: {
       *   beforeBreadcrumbs: '@@/Announcement.vue',
       *  }
       * }
       * ```
       * 
       * 
       */
      pageInjections?: {


        /**
         * Custom components which can be injected into resource list page.
         * 
         * Component accepts next props: [resource, adminUser, meta]
         */
        list?: {
          beforeBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          afterBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          beforeActionButtons?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          customActionIcons?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          customActionIconsThreeDotsMenuItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          tableBodyStart?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          tableRowReplace?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
        },

        /**
         * Custom components which can be injected into resource show page.
         * 
         * Component accepts next props: [record, resource, adminUser, meta]
         */
        show?: {
          beforeBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          afterBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
        },

        /**
         * Custom components which can be injected into resource edit page.
         * 
         * Component accepts next props: [record, resource, adminUser, meta]
         */
        edit?: {
          beforeBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          afterBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
        },

        /**
         * Custom components which can be injected into resource create page.
         * 
         * Component accepts next props: [resource, adminUser, meta]
         */
        create?: {
          beforeBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          afterBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
        },
      }
    },
}

export interface AdminForthResourceCommon extends AdminForthResourceInputCommon {
  resourceId: string,
  label: string,

  columns: Array<AdminForthResourceColumnCommon>,
}


export type ValidationObject = {
    /**
     * Should be pure string (not RegExp string)
     * 
     * Example:
     * 
     * ```ts
     * // regex for email
     * regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
     * ```
     * 
     */
    regExp: string,

    /**
     * Error message shown to user if validation fails
     * 
     * Example: "Invalid email format"
     */
    message: string,

    /**
     * Whether to check case sensitivity (i flag)
     */
    caseSensitive?: boolean,
    
    /**
     * Whether to check Multiline strings (m flag)
     */
    multiline?: boolean, 
    
    /**
     * Whether to check global strings (g flag)
     */
    global?: boolean
}



export enum AdminForthResourcePages {
  list = 'list',
  show = 'show',
  edit = 'edit',
  create = 'create',
  filter = 'filter',
}

export type ShowInResolved = {
  [key in AdminForthResourcePages]: boolean
}

export interface AdminForthPolymorphicForeignResource {
  resourceId: string,
  whenValue: string,
}
export interface AdminForthForeignResourceCommon {
  resourceId?: string,
  polymorphicResources?: Array<AdminForthPolymorphicForeignResource>,
  polymorphicOn?: string,
  unsetLabel?: string,
  searchableFields?: string | string[],
  searchIsCaseSensitive?: boolean,
}

export type FillOnCreateFunction = (params: {
  initialRecord: any,
  adminUser: AdminUser,
}) => any;

export type suggestOnCreateFunction = (params: {
  adminUser: AdminUser,
}) => string | number | boolean | object;

/**
 * Column describes one field in the table or collection in database.
 */
export interface AdminForthResourceColumnInputCommon {
  /**
   * Column name in database.
   */
  name: string,

  /**
   * How column can be labled in the admin panel.
   * Use it for renaming columns. Defaulted to column name with Uppercased first letter.
   */
  label?: string,

  /**
   * Type of data in column.
   * AdminForth will use this information to render proper input fields in the admin panel.
   * AdminForth tries to guess type of data from database column type automatically for typed databases like SQL-based.
   * However you can explicitly set it to any value. E.g. set AdminForthDataTypes.DATETIME for your string column in SQLite, which stores ISO date strings.
   */
  type?: AdminForthDataTypes,

  /**
   * Defines whether column is array and what type of items it contains.
   * AdminForth will use this information to render proper input fields in the admin panel with control buttons to add and remove items.
   * If enabled, requires column type to be JSON.
   * Cannot be used with masked columns, columns with foreignResource or primary key columns.
   */
  isArray?: {
    enabled: boolean,
    /**
     * Type of items in array. Cannot be JSON or RICHTEXT.
     */
    itemType: AdminForthDataTypes,
    /**
     * If enabled, AdminForth will allow to add items with the same value.
     */
    allowDuplicateItems?: boolean,
  },

  /**
   * An optional configuration object for extra settings.
   */
  extra?: {

    /**
     * How many levels of JSON should be collapsed. 
     * `0` means - root level will be already collapsed e.g. `{a:1}` will show `{...}` where `'...'` is clickable
     * `1` means - root level will be shown, but next sub-level will be collapsed e.g. `{a: {b: 1}}` will show `{a: ...}` where `'...'` is clickable
     * 
     * Default is 1. 
     */
    jsonCollapsedLevel?: number
  }

  /**
   * Whether to use this column as record identifier.
   * Only one column can be primary key.
   * AdminForth tries to guess primary key automatically first.
   */
  primaryKey?: boolean,

  /**
   * Whether AdminForth will require this field to be filled in create and edit forms.
   * Can be set to boolean or object with create and edit properties.
   * If boolean, it will be used for both create and edit forms.
   */
  required?: boolean | { create?: boolean, edit?: boolean },

  /**
   * Prefix and suffix for input field on create and edit pages.
   */
  inputPrefix?: string,
  inputSuffix?: string,

  /**
   * Whether AdminForth will show editing note near the field in edit/create form.
   */
  editingNote?: string | { create?: string, edit?: string },

  /**
   * Whether AdminForth will allow to edit this field in editing mode.
   */
  editReadonly?: boolean,

  /**
   * Defines on which AdminForth pages this field will be shown. By default all.
   * Example: if you want to show field only in create and edit pages, set it to
   * 
   * ```ts
   * showIn: { create: true, edit: true }
   * ```
   * 
   * If you wish show only in list view, set it to:
   * 
   * ```ts
   * showIn: { all: false, list: true }
   * ```
   * 
   * If you wish to hide only in list you can use:
   * 
   * 
   * ```ts
   * showIn: { all: true, list: false }
   * ```
   * 
   * or
   * 
   * ```ts
   * showIn: { list: false } // all: true is by default already
   * ```
   * 
   * Also might have callback which will be called with same syntax as allowedActions.
   * 
   * ```ts
   * showIn: {
   *  list: ({ resource, adminUser }) => {
   *    return adminUser.dbUser.role === 'superadmin';
   *  },
   *  show: true,
   * }
   * ```
   * 
   */
  showIn?: ShowInResolved,

  /**
   * Called on the backend when the record is saved to a database. Value returned by `fillOnCreate` will be saved to the database. 
   */
  fillOnCreate?: FillOnCreateFunction,

  /**
   * Single value that will be substituted in create form. User can change it before saving the record.
   */
  suggestOnCreate?: string | number | boolean | object | suggestOnCreateFunction,

  /**
   * Whether AdminForth will request user to enter unique value during creating or editing record.
   * This option causes AdminForth to make a request to database to check if value is unique. 
   * (Constraints are not used, so for large-tables performance make sure you have unique index in database if you set this option to true)
   */
  isUnique?: boolean,

  /**
   * Will automatically convert any capital letters to lowercase in input during editing
   */
  enforceLowerCase?: boolean,

  /**
   * Runtime validation Regexp rules for this field.
   */
  validation?: Array<ValidationObject>,

  /**
   * Allows to make the field which does not exist in database table.
   * Examples: add custom show field with user country flag:
   * 
   * ```ts
   * {
   *  label: 'Country Flag',
   *  type: AdminForthDataTypes.STRING,
   *  virtual: true,
   *  showIn: {
   *    [AdminForthResourcePages.edit]: false,
   *    [AdminForthResourcePages.create]: false,
   *    [AdminForthResourcePages.filter]: false,
   *  },
   *  components: {
   *    show: '@@/CountryFlag.vue',
   *    list: '@@/CountryFlag.vue',
   *   },
   * }
   * ```
   * 
   * This field will be displayed in show and list views with custom component `CountryFlag.vue`. CountryFlag.vue should be placed in custom folder and can be next:
   * 
   * ```html
   * <template>
   *  {{ getFlagEmojiFromIso(record.ipCountry) }}
   * </template>
   * 
   * <script setup>
   * const props = defineProps(['record']);
   * 
   * function getFlagEmojiFromIso(iso) {
   *    return iso.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
   * }
   * </script>
   * ```
   * 
   */
  virtual?: boolean,

  /**
   * Allow AdminForth to execute SELECT min(column) and SELECT max(column) queries to get min and max values for this column.
   * This would improve UX of filters by adding sliders for numeric columns.
   * 
   * NOTE: By default is option is `false` to prevent performance issues on large tables.
   * If you are going to set it to `true`, make sure you have a one-item index on this column (one index for each column which has it) or ensure your table will not have a large number of records.
   * 
   */
  allowMinMaxQuery?: boolean,

  /**
   * Custom components which will be used to render this field in the admin panel.
   */
  components?: AdminForthFieldComponents

  /**
   * Maximum length of string that can be entered in this field.
   */
  maxLength?: number, 

  /**
   * Minimum length of string that can be entered in this field.
   */
  minLength?: number,

  /**
   * Minimum value that can be entered in this field.
   */
  minValue?: number,

  /**
   * Maximum value that can be entered in this field.
   */
  maxValue?: number,

  /**
   * Enum of possible values for this field.
   */
  enum?: Array<AdminForthColumnEnumItem>,

  /**
   * Foreign resource which has pk column with values same that written in this column.
   */
  foreignResource?: AdminForthForeignResourceCommon,

  /**
   * Whether to allow this column to be sortable in list view.
   * If true, AdminForth will add sorting buttons to the column header in list view and clicking on it will change sorting state of the column.
   */
  sortable?: boolean,

  
  filterOptions?: {
    /**
     * Decrease number of requests by adding debounce time to filter requests.
     */
    debounceTimeMs?: number,
    /**
     * If false - will force EQ operator for filter instead of ILIKE.
     */
    substringSearch?: boolean,
    /**
     * Boolean value that determines what select input type to display on filter page.
     */
    multiselect?: boolean,
  },

  /**
   * if true field will !not be passed to UI under no circumstances, but will be presented in hooks
   */
  backendOnly?: boolean,

  /**
   * Masked fields will be displayed as `*****` on Edit and Create pages.
   */
  masked?: boolean,

  /**
   * Sticky position for column
   */
  listSticky?: boolean;

  /**
   * Show field only if certain conditions are met.
   */
  showIf?: Predicate;
}

export interface AdminForthResourceColumnCommon extends AdminForthResourceColumnInputCommon {

  /**
   * Internal type which indicates original type of column in database.
   */
  _underlineType?: string,

  required?: { create?: boolean, edit?: boolean },

  editingNote?: { create?: string, edit?: string },

  /**
   * Minimal value stored in this field.
   */
  min?: number,

  /**
   * Maximum value stored in this field.
   */
  max?: number,
}

export enum AdminForthMenuTypes {
  /**
   * HEADING is just a label in the menu.
   * Respect `label` and `icon` property in {@link AdminForthConfigMenuItem}
   */
  heading = 'heading',

  /**
   * GROUP is a group of menu items.
   * Respects `label`, `icon` and `children` properties in {@link AdminForthConfigMenuItem}
   * use @AdminForthMenuTypes.open to set if group is open by default
   */
  group = 'group',

  /**
   * RESOURCE is a link to a resource.
   * Respects `label`, `icon`,  `resourceId`, `homepage`, `isStaticRoute` properties in {@link AdminForthConfigMenuItem}
   */
  resource = 'resource',

  /**
   * PAGE is a link to a custom page.
   * Respects `label`, `icon`, `path`, `component`, `homepage`, `isStaticRoute`, properties in {@link AdminForthConfigMenuItem}
   * 
   * Example:
   * 
   * ```ts
   * \{
   *  type: AdminForthMenuTypes.PAGE,
   *  label: 'Custom Page',
   *  icon: 'home',
   *  path: '/dash',
   *  component: '@@/Dashboard.vue',
   *  homepage: true,
   * \}
   * ```
   * 
   */
  page = 'page',

  /**
   * GAP ads some space between menu items.
   */
  gap = 'gap',

  /**
   * DIVIDER is a divider between menu items.
   */
  divider = 'divider',
}


/**
 * Menu item which displayed in the left sidebar of the admin panel.
 */
export interface AdminForthConfigMenuItem {
  type?: AdminForthMenuTypes | keyof typeof AdminForthMenuTypes,

  /**
   * Label for menu item which will be displayed in the admin panel.
   */
  label?: string,

  /**
   * Icon for menu item which will be displayed in the admin panel.
   * Supports iconify icons in format `<icon set name>:<icon name>`
   * Browse available icons here: https://icon-sets.iconify.design/
   * 
   * Example:
   * 
   * ```ts
   * icon: 'flowbite:brain-solid', 
   * ```
   * 
   */
  icon?: string,

  /**
   * Path to custom component which will be displayed in the admin panel.
   * 
   */
  path?: string,

  /**
   * Component to be used for this menu item. Component should be placed in custom folder and referenced with `@@/` prefix.
   * Supported for AdminForthMenuTypes.PAGE only!
   * Example:
   * 
   * ```ts
   * component: '@@/Dashboard.vue',
   * ```
   * 
   */
  component?: string,

  /**
   * Resource ID which will be used to fetch data from.
   * Supported for AdminForthMenuTypes.RESOURCE only!
   * 
   */
  resourceId?: string,

  /**
   * If true, group will be open by default after user login to the admin panel.
   * Also will be used to redirect from root path.
   */
  homepage?: boolean,

  /**
   * Where Group is open by default
   * Supported for AdminForthMenuTypes.GROUP only!
   * 
   */    
  open?: boolean,

  /**
   * Children menu items which will be displayed in this group.
   * Supported for AdminForthMenuTypes.GROUP only!
   */
  children?: Array<AdminForthConfigMenuItem>,

  /**
   * By default all pages are imported dynamically with lazy import().
   * If you wish to import page statically, set this option to true.
   * Homepage will be imported statically by default. but you can override it with this option.
   */
  isStaticRoute?: boolean,

  meta?: {
    title?: string,
  },

  /**
   * Optional callback which will be called before rendering the menu for each item.
   * You can use it to hide menu items depending on some user
   */
  visible?: (user: AdminUser) => boolean,

  /**
   * Optional callback which will be called before rendering the menu for each item.
   * Result of callback if not null will be used as a small badge near the menu item.
   */
  badge?: string | ((user: AdminUser) => Promise<string>),

  /**
   * Tooltip shown on hover for badge
   */
  badgeTooltip?: string,



  /**
   * Item id will be automatically generated from hashed resourceId+Path+label
   */
  itemId?: string,  // todo move to runtime type
}


export interface ResourceVeryShort {
  resourceId: string,
  label: string,
}

export interface UserData {
  pk: string,
  [key: string]: any,
}

export type AnnouncementBadgeResponse = { text?: string, html?: string, closable?: boolean, title?: string };

export interface AdminForthConfigForFrontend {
  brandName: string,
  usernameFieldName: string,
  loginBackgroundImage: string,
  loginBackgroundPosition: string,
  removeBackgroundBlendMode: boolean,
  title?: string,
  demoCredentials?: string,
  loginPromptHTML?: string | (() => string | Promise<string> | void | Promise<void> | Promise<undefined>) | undefined 
  loginPageInjections: {
    underInputs: Array<AdminForthComponentDeclaration>,
    panelHeader: Array<AdminForthComponentDeclaration>,
  },
  rememberMeDuration: string,
  showBrandNameInSidebar: boolean,
  showBrandLogoInSidebar: boolean,
  brandLogo?: string,
  iconOnlySidebar?: { 
    logo?: string,
    enabled?: boolean,
    expandedSidebarWidth?: string,
  },
  singleTheme?: 'light' | 'dark',
  datesFormat: string,
  timeFormat: string,
  auth: any,
  userFullnameField: string,
  usernameField: string,
  emptyFieldPlaceholder?: string | {
    show?: string,
    list?: string,
  },
  announcementBadge?: AnnouncementBadgeResponse | null,
  globalInjections: {
    userMenu: Array<AdminForthComponentDeclarationFull>,
    header: Array<AdminForthComponentDeclarationFull>,
    sidebar: Array<AdminForthComponentDeclarationFull>,
    sidebarTop: Array<AdminForthComponentDeclarationFull>,
    everyPageBottom: Array<AdminForthComponentDeclarationFull>,
  },
  customHeadItems?: {
    tagName: string;
    attributes: Record<string, string | boolean>;
    innerCode?: string;
  }[],
  settingPages?:{
    icon?: string,
    pageLabel: string,
    slug?: string,
    component: string,
    isVisible?: boolean
  }[],
}

export interface GetBaseConfigResponse {
  user: UserData,
  resources: ResourceVeryShort[],
  menu: AdminForthConfigMenuItem[],
  config: AdminForthConfigForFrontend,
  adminUser: AdminUser,
  version: string,
}