import { Express } from 'express';

export interface CodeInjectorType {
  srcFoldersToSync: Object;
  allComponentNames: Object;
}

/**
 * Implement this interface to create custom HTTP server adapter for AdminForth.
 */
export interface GenericHttpServer {

  // constructor(adminforth: AdminForthClass): void;

  /**
   * Sets up HTTP server to serve AdminForth SPA.
   * if hotReload is true, it should proxy all requests and headers to Vite dev server at `http://localhost:5173$\{req.url\}`
   * otherwise it should serve AdminForth SPA from dist folder. See Express for example.
   */
  setupSpaServer(): void;

  /**
   * Method which should register endpoint in HTTP server.
   * 
   * @param options : Object with method, path and handler properties.
   */
  endpoint(options: {
    method: string,
    noAuth?: boolean,
    path: string,
    handler: (body: any, adminUser: any, query: {[key: string]: string}, headers: {[key: string]: string}, cookies: {[key: string]: string}, response: {
      setHeader: (key: string, value: string) => void,
      setStatus: (code: number, message: string) => void,
    }) => void,
  }): void;

}

export type AdminUser = {
  /**
   * primaryKey field value of user in table which is defined by {@link AdminForthConfig.auth.resourceId}
   * or null if it is user logged in as {@link AdminForthConfig.rootUser}
   */
  pk: string | null,

  /**
   * Username which takend from {@link AdminForthConfig.auth.usernameField} field in user resource {@link AdminForthConfig.auth.resourceId}
   */
  username: string,
  isRoot: boolean,
  dbUser: any,
}

export interface ExpressHttpServer extends GenericHttpServer {

  /**
   * Call this method to serve AdminForth SPA from Express instance.
   * @param app : Express instance
   */
  serve(app: Express): void;

  /**
   * Method (middleware) to wrap express endpoints with authorization check.
   * Adds adminUser to request object if user is authorized. Drops request with 401 status if user is not authorized.
   * @param callable : Function which will be called if user is authorized.
   * 
   * Example:
   * 
   * ```ts
   * expressApp.get('/myApi', authorize((req, res) => \{
   *  console.log('User is authorized', req.adminUser);
   *  res.json(\{ message: 'Hello World' \});
   * \}));
   * ``
   * 
   */
  authorize(callable: Function): void;
}


export interface AdminForthClass {
  config: AdminForthConfig;
  codeInjector: CodeInjectorType;
  express: GenericHttpServer;


  auth: {

    verify(jwt : string): Promise<any>;
  }

  /**
   * Internal flag which indicates if AdminForth is running in hot reload mode.
   */
  runningHotReload: boolean;

  /**
   * Connects to databases defined in datasources and fetches described resource columns to find out data types and constraints.
   * You must call this method as soon as possible after AdminForth class is instantiated.
   */
  discoverDatabases(): Promise<void>;

  /**
   * Bundles AdminForth SPA by injecting custom components into internal pre-made SPA source code. It generates internally dist which then will be
   * served by AdminForth HTTP adapter.
   * Bundle is generated in /tmp folder so if you have ramfs or tmpfs this operation will be faster.
   * 
   * We recommend calling this method from dedicated script which will be run by CI/CD pipeline in build time. This ensures lowest downtime for your users.
   * However for simple setup you can call it from your main script, and users will see some "AdminForth is bundling" message in the admin panel while app is bundling.
   */
  bundleNow({ hotReload, verbose }: { hotReload: boolean, verbose: boolean }): Promise<void>;

  /**
   * This method will be automatically called from AdminForth HTTP adapter to serve AdminForth SPA.
   */
  setupEndpoints(server: GenericHttpServer): void;
}


export interface AdminForthPluginType {
  adminforth: AdminForthClass;
  pluginDir: string;
  customFolderName: string;
  pluginInstanceId: string;

  /**
   * AdminForth plugins concept is based on modification of full AdminForth configuration
   * to add some custom functionality. For example plugin might simply add custom field to resource by reusing 
   * {@link AdminForthResourceColumn.components} object, then add some hook which will modify record before getting or saving it to database.
   * 
   * So this method is core of AdminForth plugins. It allows to modify full resource configuration.
   * @param adminforth Instance of AdminForthClass
   * @param resourceConfig Resource configuration object which will be modified by plugin
   */
  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource): void;
  componentPath(componentFile: string): string;

  /**
   * Here you can register custom endpoints for your plugin.
   * 
   * @param server 
   */
  setupEndpoints(server: GenericHttpServer): void;
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

export enum AdminForthResourcePages {
  list = 'list',
  show = 'show',
  edit = 'edit',
  create = 'create',
  filter = 'filter',
  
}


/**
 * Menu item which displayed in the left sidebar of the admin panel.
 */
export type AdminForthConfigMenuItem = {
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
     *  components: {
     *    show: '@@/CountryFlag.vue',
     *    list: '@@/CountryFlag.vue',
     *   },
     * }
     * ```
     * 
     * This field will be displayed in show and list views with custom component `CountryFlag.vue`. CountryFlag.vue should be placed in custom folder and can be next:
     * 
     * ```vue
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
    maxLength?: number, 
    minLength?: number,
    min?: number,
    max?: number,
    minValue?: number,
    maxValue?: number,
    enum?: Array<AdminForthColumnEnumItem>,
    foreignResource?:AdminForthForeignResource,
    sortable?: boolean,
    backendOnly?: boolean, // if true field will not be passed to UI under no circumstances, but will be presented in hooks

    /**
     * Masked fields will be displayed as `*****` on Edit and Create pages.
     */
    masked?: boolean,
}
  

/**
 * Modify query to change how data is fetched from database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type BeforeDataSourceRequestFunction = (params: {resource: AdminForthResource, adminUser: AdminUser, query: any}) => Promise<{ok: boolean, error?: string}>;

/**
 * Modify response to change how data is returned after fetching from database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type AfterDataSourceResponseFunction = (params: {resource: AdminForthResource, adminUser: AdminUser, response: any}) => Promise<{ok: boolean, error?: string}>;

/**
 * Modify record to change how data is saved to database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type BeforeSaveFunction = (params:{resource: AdminForthResource, adminUser: AdminUser, record: any}) => Promise<{ok: boolean, error?: string}>;

/**
 * Modify record to change how data is saved to database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type AfterSaveFunction = (params: {resource: AdminForthResource, adminUser: AdminUser, record: any}) => Promise<{ok: boolean, error?: string}>;


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
     * Array of plugins which will be used to modify resource configuration.
     * 
     */
    plugins?: Array<AdminForthPluginType>,
    hooks?: {
      show?: {
        beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,
        afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
      },
      list?: {
        beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,
        afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
      },
      create?: {
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
        afterSave?: AfterSaveFunction | Array<AfterSaveFunction>,
      },
      edit?: {
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
        afterSave?: AfterSaveFunction | Array<AfterSaveFunction>,
      },
      delete?: {
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
        afterSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
      },
    },
    options?: {
      bulkActions?: Array<{
        label: string,
        state: string,
        icon?: string,
        action: Function,
        id?: string,
        confirm?: string,
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
         * Component accepts next props: [resource, adminUser, meta]
         */
        list?: {
          beforeBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          afterBreadcrumbs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
          bottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
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
       * components: {
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
  

export enum AllowedActionsEnum {
  show = 'show',
  list = 'list',
  edit = 'edit',
  create = 'create',
  delete = 'delete',
  filter = 'filter',
}


export type AllowedActions = {
  [key in AllowedActionsEnum]?: boolean
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

export type AdminForthComponentDeclarationFull = {
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
   * ```vue
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

export type AdminForthFieldComponents = {
    /**
     * Show component is used to redefine cell which renders field value in show view.
     * Component accepts next properties: [record, column, resource, adminUser, meta].
     * 
     * Example: `FullName.vue`
     * 
     * ```vue
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
     * 
     */
    list?: AdminForthComponentDeclaration,
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


export type AdminForthColumnEnumItem = {
    value: any | null,
    label: string,
} 

export type AdminForthForeignResource = {
    resourceId: string,
    hooks?: {
      dropdownList?: {
        beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,
        afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
      },
    },
  }