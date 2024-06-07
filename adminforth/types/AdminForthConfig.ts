

export type AdminForthConfigMenuItem = {
    type?: 'heading' | 'group' | 'resource' | 'page' | 'gap' | 'divider',
    label?: string,
    icon?: string,
    path?: string,
    component?: string,
    resourceId?: string,
    homepage?: boolean,
    children?: Array<AdminForthConfigMenuItem>,
  }
  
  
export type AdminForthResourceColumn = {
    name: string,
    label?: string,
    type?: AdminForthTypesValues,
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
    itemLabel?: Function,
    hooks?: {
        show?: {
          beforeDatasourceRequest?: Function,
          afterDatasourceResponse?: Function,
        },
        list?: {
          beforeDatasourceRequest?: Function,
          afterDatasourceResponse?: Function,
        },
        create?: {
          beforeSave?: Function,
          afterSave?: Function,
        },
        edit?: {
          beforeSave?: Function,
          afterSave?: Function,
        },
        delete?: {
          beforeSave?: Function,
          afterSave?: Function,
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
        allowDelete?: boolean,
        
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
    },
    baseUrl?: string,
    brandName?: string,
    datesFormat?: string,
    deleteConfirmation?: boolean,
    title?: string,
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
    show?: string,
    create?: string,
    edit?: string,
}


export type AdminForthTypesValues = 
  | 'string'
  | 'integer'
  | 'float'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'text'
  | 'json';

export type AdminForthResourceColumnEnumElement = {
    value: string | null,
    label: string,
} 

export type AdminForthResourceColumnForeignResource = {
    resourceId: string,
    hooks?: {
        beforeDatasourceRequest?: Function,
        afterDatasourceResponse?: Function,
    },
  }