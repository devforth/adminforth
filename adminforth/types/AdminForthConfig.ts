

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

export type AdminForthConfigMenuItem = {
    type?: 'heading' | 'group' | 'resource' | 'page' | 'gap' | 'divider',
    label?: string,
    icon?: string,
    path?: string,
    component?: string,
    resourceId?: string,
    homepage?: boolean,
    open?: boolean,
    children?: Array<AdminForthConfigMenuItem>,
    isStaticRoute?: boolean,
    meta?: {
      title?: string,
    },
  }
  
  
export type AdminForthResourceColumn = {
    name: string,
    label?: string,
    type?: AdminForthDataTypes,
    primaryKey?: boolean,
    required?: boolean | { create: boolean, edit: boolean },
    editingNote?: string | { create: string, edit: string },
    showIn?: Array<string>,
    fillOnCreate?: Function,
    isUnique?: boolean,
    validation?: Array<ValidationObject>,
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
     * itemLabel: (item) => `${item.name} - ${item.id}`,
     * ```
     * 
     */
    itemLabel?: Function,

    /**
     * Hook which allow you to modify item title
     * 
     * Example:
     * 
     * ```ts
     * itemTitle: (item) => `${item.name} - ${item.id}`,
     * ```
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
      listPageSize?: number,
    },
  }
  
export type AdminForthDataSource = {
    id: string,
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
    dataSources: Array<DataSource>,

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

export type DataSource = {
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