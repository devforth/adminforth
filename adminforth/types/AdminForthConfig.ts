

export interface CodeInjector {
  srcFoldersToSync: Object;
  allComponentNames: Object;
}

export interface AdminForthClass {
  config: AdminForthConfig;
  codeInjector: CodeInjector;
}


export interface AdminForthPluginType {
  adminforth: AdminForthClass;
  pluginDir: string;
  customFolderName: string;
  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource): void;
  componentPath(componentFile: string): string;
}

export enum AdminForthMenuType {
  /**
   * HEADING is just a label in the menu.
   * Respect `label` and `icon` property in {@link AdminForthConfigMenuItem}
   */
  HEADING = 'heading',

  /**
   * GROUP is a group of menu items.
   * Respects `label`, `icon` and `children` properties in {@link AdminForthConfigMenuItem}
   * use @AdminForthMenuType.open to set if group is open by default
   */
  GROUP = 'group',

  /**
   * RESOURCE is a link to a resource.
   * Respects `label`, `icon`,  `resourceId`, `homepage`, `isStaticRoute` properties in {@link AdminForthConfigMenuItem}
   */
  RESOURCE = 'resource',

  /**
   * PAGE is a link to a custom page.
   * Respects `label`, `icon`, `path`, `component`, `homepage`, `isStaticRoute`, properties in {@link AdminForthConfigMenuItem}
   * 
   * Example:
   * 
   * ```ts
   * \{
   *  type: AdminForthMenuType.PAGE,
   *  label: 'Custom Page',
   *  icon: 'home',
   *  path: '/dash',
   *  component: '@@/Dashboard.vue',
   *  homepage: true,
   * \}
   * ```
   * 
   */
  PAGE = 'page',

  /**
   * GAP ads some space between menu items.
   */
  GAP = 'gap',

  /**
   * DIVIDER is a divider between menu items.
   */
  DIVIDER = 'divider',
}

export enum AdminForthResourcePages {
  LIST = 'list',
  SHOW = 'show',
  EDIT = 'edit',
  CREATE = 'create',
  FILTER = 'filter',
}


/**
 * Menu item which displayed in the left sidebar of the admin panel.
 */
export type AdminForthConfigMenuItem = {
    type?: AdminForthMenuType,

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
     * Supported for AdminForthMenuType.PAGE only!
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
     * Supported for AdminForthMenuType.RESOURCE only!
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
     * Supported for AdminForthMenuType.GROUP only!
     * 
     */    
    open?: boolean,

    /**
     * Children menu items which will be displayed in this group.
     * Supported for AdminForthMenuType.GROUP only!
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
  }
  

/**
 * Column describes one field in the table or collection in database.
 */
export type AdminForthResourceColumn = {
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
    required?: boolean | { create: boolean, edit: boolean },

    /**
     * Whether AdminForth will show editing note near the field in edit/create form.
     */
    editingNote?: string | { create: string, edit: string },

    /**
     * On which AdminForth pages this field will be shown. By default all.
     * Example: if you want to show field only in create and edit pages, set it to 
     * 
     * ```ts
     * showIn: [AdminForthResourcePages.CREATE, AdminForthResourcePages.EDIT]
     * ```
     * 
     */
    showIn?: Array<AdminForthResourcePages>,

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
     * Runtime validation Regexp rules for this field.
     */
    validation?: Array<ValidationObject>,

    /**
     * Allows to make the field which does not exist in database table.
     * Examples: add custom show field with user country flag:
     * 
     * ```ts
     * {
     *  label: 'Country',
     *  type: AdminForthDataTypes.STRING,
     *  virtual: true,
     *  showIn: [AdminForthResourcePages.SHOW, AdminForthResourcePages.LIST],
     *  component: {
     *    show: '@@/CountryFlag.vue',
     *    list: '@@/CountryFlag.vue',
     *   },
     * }
     * ```
     * This field will be displayed in show and list views with custom component `CountryFlag.vue`. CountryFlag.vue should be placed in custom folder and can be next:
     * 
     * ```vue
     * <template>
     *  {{ getFlagEmojiFromIso(row.ipCountry) }}
     * </template>
     * 
     * <script setup>
     * function getFlagEmojiFromIso(iso) {
     *    return iso.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
     * }
     * </script>
     * 
     */
    virtual?: boolean,
    allowMinMaxQuery?: boolean,
    component?: AdminForthResourceColumnComponent
    maxLength?: number, 
    minLength?: number,
    min?: number,
    max?: number,
    minValue?: number,
    maxValue?: number,
    enum?: Array<AdminForthResourceColumnEnumElement>,
    foreignResource?:AdminForthResourceColumnForeignResource,
    sortable?: boolean,
    backendOnly?: boolean, // if true field will not be passed to UI under no circumstances, but will be presented in hooks
}
  
/**
 * Resource describes one table or collection in database.
 * AdminForth generates set of pages for 'list', 'show', 'edit', 'create', 'filter' operations for each resource.
 */
export type AdminForthResource = {
    /**
     * Unique identifier of resource. By default it equals to table name in database. 
     * If you wish you can explicitly set it to any string.
     * We added to support cases when 2 datasources have tables with the same name.
     */
    resourceId: string,

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
    columns: Array<AdminForthResourceColumn>,

    
    dataSourceColumns?: Array<AdminForthResourceColumn>,  // TODO, mark as private

    /**
     * Hook which allow you to modify item label
     * 
     * Example:
     * 
     * ```ts
     * recordLabel: (record) => `${record.name} - ${item.id}`,
     * ```
     * 
     */
    recordLabel?: Function,

    /**
     * Array of plugins which will be used to modify resource configuration.
     * 
     */
    plugins?: Array<AdminForthPluginType>,
    hooks?: {
      show?: {
        beforeDatasourceRequest?: Function | Array<Function>,
        afterDatasourceResponse?: Function | Array<Function>,
      },
      list?: {
        beforeDatasourceRequest?: Function | Array<Function>,
        afterDatasourceResponse?: Function | Array<Function>,
      },
      create?: {
        beforeSave?: Function | Array<Function>,
        afterSave?: Function | Array<Function>,
      },
      edit?: {
        beforeSave?: Function | Array<Function>,
        afterSave?: Function | Array<Function>,
      },
      delete?: {
        beforeSave?: Function | Array<Function>,
        afterSave?: Function | Array<Function>,
      },
    },
    options?: {
      bulkActions?: Array<{
        label: string,
        state: string,
        icon: string,
        action: Function,
        id?: string,
      }>,
      allowedActions?: AllowedActions,

      /** 
       * Page size for list view
       */
      listPageSize?: number,

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
         * Component accepts next props: [resource, adminUser]
         */
        list?: {
          beforeBreadcrumbs?: string | Array<string>,
          afterBreadcrumbs?: string | Array<string>,
          bottom?: string | Array<string>,
        },
        show?: {
          beforeBreadcrumbs?: string | Array<string>,
          afterBreadcrumbs?: string | Array<string>,
          bottom?: string | Array<string>,
        },
        edit?: {
          beforeBreadcrumbs?: string | Array<string>,
          afterBreadcrumbs?: string | Array<string>,
          bottom?: string | Array<string>,
        },
        create?: {
          beforeBreadcrumbs?: string | Array<string>,
          afterBreadcrumbs?: string | Array<string>,
          bottom?: string | Array<string>,
        },
      }
    },
  }
  
/**
 * Data source describes database connection which will be used to fetch data for resources.
 * Each resource should use one data source.
 */
export type AdminForthDataSource = {
  /**
   * ID of datasource which you will use in resources to specify from which database to fetch data from
   */
  id: string,

  /**
    * URL to database. Examples:
    * 
    * - MongoDB: `mongodb://<user>:<password>@<host>:<port>/<database>`
    * - PostgreSQL: `postgresql://<user>:<password>@<host>:<port>/<database>`
    * - SQLite: `sqlite://<path>`
    */
  url: string,
}


/**
 * Main configuration object for AdminForth
 */
export type AdminForthConfig = {

    /**
     * Root user should be used to login to the admin panel first time.
     * Then you should create User for yourself using AdminForth (so it will be persisted in DB), 
     * and then disable this option as it is less secure
     */
    rootUser?: {
      /**
       * Username for root user
       */
      username: string,

      /**
       * Password for root user
       */
      password: string,
    },

    /**
     * Authorization module configuration
     */
    auth?: {
      /**
       * Resource ID for user resource. 
       * Resource is a table in database where users will be stored and fetched from. Resources and their ids are defined in resources section of the config.
       * In other words this setting is a reference to a table in database where users will be fetched from on login. 
       */
      resourceId: string,

      /**
       * Field name (column name) in user resource which will be used as username for searching user in database during login.
       * Can be e.g. 'email' or 'username'
       */
      usernameField: string,
      
      /**
       * Field name (column name) in user resource which will be used to get hash of password.
       * Can be e.g. 'passwordHash'
       */
      passwordHashField: string,

      /**
       * File path to custom background image for login page
       * Example:
       * Place file `login-background.jpg` to `./custom` folder and set this option:
       * 
       * ```ts
       * loginBackgroundImage: '@@/login-background.jpg',
       * ```
       */
      loginBackgroundImage?: string,

      /**
       * Optionally if your users table has a field(column) with full name, you can set it here.
       * This field will be used to display user name in the top right corner of the admin panel.
       */
      userFullNameField?: string,
    },
     /**
      * Array of resources which will be displayed in the admin panel.
      * Resource represents one table or collection in database.
      * Each resource has its own configuration.
      */ 
    resources: Array<AdminForthResource>,

    /**
     * Array of left sidebar menu items which will be displayed in the admin panel.
     * Menu items can be links to resources or custom pages.
     * Menu items can be grouped.
     * 
     */
    menu: Array<AdminForthConfigMenuItem>,

    /**
     * If you want use custom DataSource which is not supported by AdminForth yet, you can define it's class here
     * 
     */
    databaseConnectors?: any,  // TODO Define interface for database connector

    /**
     * List of data sources which will be used to fetch data for resources.
     * Datasource is one database connection
     * 
     */
    dataSources: Array<AdminForthDataSource>,

    /**
     * Settings which allow you to customize AdminForth
     * 
     */
    customization?: {
      /**
       * Your app name
       */
      brandName?: string,

      /**
       * Path to your app logo
       * 
       * Example:
       * Place file `logo.svg` to `./custom` folder and set this option:
       * 
       * ```ts
       * brandLogo: '@@/logo.svg',
       * ```
       * 
       */
      brandLogo?: string,

      /**
       * DayJS format string for all dates in the app
       */
      datesFormat?: string,

      /**
       * HTML title tag value, defaults to brandName
       */
      title?: string,

      /**
       * Placeholder for empty fields in lists and show views, by default empty string ''
       */
      emptyFieldPlaceholder?: {
        show?: string,
        list?: string,
        
      } | string,

      /**
       * Relative or absolute path to custom components directory
       * By default equals  `./custom`.
       * 
       * Custom .vue files, images, and any other assets placed in this directory can be accessed in AdminForth components and configs with `@@/`.
       * 
       * For example if file path is `./custom/comp/my.vue`, you can use it in AdminForth config like this:
       * 
       * ```ts
       * component: {
       *  show: '@@/comp/my.vue',
       * }
       * ```
       * 
       */
      customComponentsDir?: string,

      /**
       * Path to custom .ts file which allows to inject custom Vue uses in SPA or add custom imports.
       * 
       * Example: Create file: `./custom/vue-uses.ts` with next content:
       * 
       * ```ts
       * import HighchartsVue from 'highcharts-vue';
       * // import '@@/custom.scss'; // here is how you can import custom styles
       *
       *  export default function (app) {
       *    app.use(HighchartsVue);
       * }
       * ```
       * 
       * Install HighCharts:
       * 
       * ```bash
       * npm install highcharts highcharts-vue
       * ```
       * 
       * And specify vueUsesFile in AdminForth config:
       * 
       * ```ts
       * vueUsesFile: '@@/vue-uses.ts',
       * ```
       * 
       */
      vueUsesFile?: string,
    },

    /**
     * If you want to Serve AdminForth from a subdirectory, e.g. on example.com/backoffice, you can specify it like:
     * 
     * ```ts
     * baseUrl: '/backoffice',
     * ```
     * 
     */
    baseUrl?: string,
   
    deleteConfirmation?: boolean,
   
    styles?: Object,
  }
  
export type AllowedActions = {
    create?: boolean,
    edit?: boolean,
    show?: boolean,
    delete?: boolean,
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
  }


export type AdminForthResourceColumnComponent = {
    show?: string,    // rewrite value in show
    showRow?: string,  // rewrite full view table row (both <td> tags)
    create?: string,
    edit?: string,
    list?: string,
}

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
};

export enum AdminForthSortDirections {
  ASC = 'asc',
  DESC = 'desc',
};


export type AdminForthResourceColumnEnumElement = {
    value: string | null,
    label: string,
} 

export type AdminForthResourceColumnForeignResource = {
    resourceId: string,
    hooks?: {
      dropdownList?: {
        beforeDatasourceRequest?: Function,
        afterDatasourceResponse?: Function,
      },
    },
  }