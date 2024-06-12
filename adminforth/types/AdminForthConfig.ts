

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
  
export  type AdminForthConfig = {
    rootUser?: {
      username: string,
      password: string,
    },
    auth?: {
      resourceId: string,
      usernameField: string,
      passwordHashField: string,
      loginBackgroundImage?: string,
      userFullNameField?: string,
    },
    resources: Array<AdminForthResource>,
    menu: Array<AdminForthConfigMenuItem>,
    databaseConnectors?: any,
    dataSources: Array<DataSource>,
    customization?: {
      customComponentsDir?: string,
      vueUsesFile?: string,
      customPublicDir?: string,
      brandName?: string,
      datesFormat?: string,
      title?: string,
      brandLogo?: string,
      emtyFieldPlaceholder?: {
        show?: string,
        list?: string,
        create?: string,
        edit?: string,
      },
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