

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
    resourceId: string,
    label?: string,
    table: string,
    dataSource: string,
    columns: Array<AdminForthResourceColumn>,
    dataSourceColumns?: Array<AdminForthResourceColumn>,
    itemLabel?: Function,
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
    resources: Array<AdminForthResource>,
    menu: Array<AdminForthConfigMenuItem>,
    databaseConnectors?: any,
    dataSources: Array<DataSource>,
    customization?: {
      customComponentsDir?: string,
      vueUsesFile?: string,
      brandName?: string,
      datesFormat?: string,
      title?: string,
      brandLogo?: string,
      emptyFieldPlaceholder?: {
        show?: string,
        list?: string,
        
      } | string,
    },
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
    regExp: string,
    message: string,
  }

export type DataSource = {
    id: string,
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