
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
  RICHTEXT = 'richtext',
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
};

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
  EditRequest = 'editRequest',
  CreateRequest = 'createRequest',
  DeleteRequest = 'deleteRequest',
  BulkActionRequest = 'bulkActionRequest',
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
  [key in AllowedActionsEnum]?: boolean
}

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
}


export interface AdminForthBulkActionCommon {
  id?: string,

  /**
   * Label for action button which will be displayed in the list view
   */
  label: string,
  state: string,

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
   *  showIn: [AdminForthResourcePages.SHOW, AdminForthResourcePages.LIST],
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
   *    showIn: [AdminForthResourcePages.SHOW],
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
   *    showIn: [AdminForthResourcePages.SHOW],
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
  meta?: any,
}

export type AdminForthComponentDeclaration = AdminForthComponentDeclarationFull | string;

/**
 * Resource describes one table or collection in database.
 * AdminForth generates set of pages for 'list', 'show', 'edit', 'create', 'filter' operations for each resource.
 */
export interface AdminForthResourceCommon {
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
    columns: Array<AdminForthResourceColumnCommon>,

    /**
     * Internal array of columns which are not virtual. You should not edit it. 
     */
    dataSourceColumns?: Array<AdminForthResourceColumnCommon>,  // TODO, mark as private

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
    recordLabel?: Function,


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
       * Allows to make groups of columns in create/edit resource pages.
       */
      createEditGroups?: {
        groupName: string;
        columns: string[];
      }[];

      /** 
       * Page size for list view
       */
      listPageSize?: number,

      /**
       * Callback to define what happens when user clicks on record in list view.
       * By default show view will be opened.
       * If you wish to open custom page, return URL to the custom page (can start with https://, or relative adminforth path)
       * If you wish to open page in new tab, add `target=_blank` get param to returned URL, example:
       * 
       * ```ts
       * listTableClickUrl: async (record, adminUser) => {
       *   return `https://google.com/search?q=${record.name}&target=_blank`;
       * }
       * ```
       * 
       * If you wish to do nothing on click, return null.
       * 
       * Example:
       * 
       * ```ts
       * listTableClickUrl: async (record, adminUser) => {
       *   return null;
       * }
       * ```
       * 
       * @param record - record which was clicked
       * @param adminUser - user who clicked
       * @returns 
       */
      listTableClickUrl?: (record: any, adminUser: AdminUser) => Promise<string | null>,

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
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          customActionIcons?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
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


export interface AdminForthForeignResourceCommon {
  resourceId: string,
}

/**
 * Column describes one field in the table or collection in database.
 */
export type AdminForthResourceColumnCommon = {
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
   * Whether AdminForth will show editing note near the field in edit/create form.
   */
  editingNote?: string | { create?: string, edit?: string },

  /**
   * On which AdminForth pages this field will be shown. By default all.
   * Example: if you want to show field only in create and edit pages, set it to 
   * 
   * ```ts
   * showIn: [AdminForthResourcePages.CREATE, AdminForthResourcePages.EDIT]
   * ```
   * 
   */
  showIn?: Array<AdminForthResourcePages | keyof typeof AdminForthResourcePages>,

  /**
   * Whether AdminForth will show this field in show view.
   */
  fillOnCreate?: Function,

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
   *  showIn: [AdminForthResourcePages.SHOW, AdminForthResourcePages.LIST],
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
   * Whether AdminForth will show this field in list view.
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

  min?: number,
  max?: number,

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

  sortable?: boolean,

  /**
   * if true field will !not be passed to UI under no circumstances, but will be presented in hooks
   */
  backendOnly?: boolean,

  /**
   * Masked fields will be displayed as `*****` on Edit and Create pages.
   */
  masked?: boolean,


  /**
   * Internal type which indicates original type of column in database.
   */
  _underlineType?: string,
}
