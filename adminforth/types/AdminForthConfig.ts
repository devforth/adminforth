import type { Express } from 'express';

export interface ICodeInjector {
  srcFoldersToSync: Object;
  allComponentNames: Object;
}

export interface IConfigValidator {
  validateConfig()
  postProcessAfterDiscover(resource: AdminForthResource): void;
}

export interface IAdminForthHttpResponse {
    setHeader: (key: string, value: string) => void,
    setStatus: (code: number, message: string) => void,
};

/**
 * Implement this interface to create custom HTTP server adapter for AdminForth.
 */
export interface IHttpServer {

  // constructor(adminforth: IAdminForth): void;

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
    handler: (
      body: any, 
      adminUser: any, 
      query: {[key: string]: string}, 
      headers: {[key: string]: string}, cookies: {[key: string]: string}, 
      response: IAdminForthHttpResponse,
    ) => void,
  }): void;

}

export type AdminUser = {
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

export interface IExpressHttpServer extends IHttpServer {

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

export interface IAdminForthFilter {
  field: string;
  operator: AdminForthFilterOperators;
  value: any;
}

export interface IAdminForthSort {
  field: string, 
  direction: AdminForthSortDirections 
}

export interface IAdminForthDataSourceConnector {
  
  /**
   * Optional.
   * You an redefine this function to define how one record should be fetched from database.
   * You you will not redefine it, AdminForth will use {@link IAdminForthDataSourceConnector.getData} with limit 1 and offset 0 and
   * filter by primary key. 
   */
  getRecordByPrimaryKeyWithOriginalTypes(resource: AdminForthResource, recordId: string): Promise<any>;


  /**
   * Function should go over all columns of table defined in resource.table and try to guess
   * data and constraints for each columns. 
   * Type should be saved to:
   * -  {@link AdminForthResourceColumn.type}
   * Constraints:
   *  - {@link AdminForthResourceColumn.required}
   *  - {@link AdminForthResourceColumn.primaryKey}
   * For string fields:
   *  - {@link AdminForthResourceColumn.maxLength}
   * For numbers:
   *  - {@link AdminForthResourceColumn.min}
   *  - {@link AdminForthResourceColumn.max}
   *  - {@link AdminForthResourceColumn.minValue}, {@link AdminForthResourceColumn.maxValue}, {@link AdminForthResourceColumn.enum}, {@link AdminForthResourceColumn.foreignResource}, {@link AdminForthResourceColumn.sortable}, {@link AdminForthResourceColumn.backendOnly}, {@link AdminForthResourceColumn.masked}, {@link AdminForthResourceColumn.virtual}, {@link AdminForthResourceColumn.components}, {@link AdminForthResourceColumn.allowMinMaxQuery}, {@link AdminForthResourceColumn.editingNote}, {@link AdminForthResourceColumn.showIn}, {@link AdminForthResourceColumn.isUnique}, {@link AdminForthResourceColumn.validation})
   * Also you can additionally save original column type to {@link AdminForthResourceColumn._underlineType}. This might be later used
   * in {@link IAdminForthDataSourceConnector.getFieldValue} and {@link IAdminForthDataSourceConnector.setFieldValue} methods.
   * 
   * 
   * @param resource 
   */
  discoverFields(resource: AdminForthResource): Promise<{[key: string]: AdminForthResourceColumn}>;


  /**
   * Used to transform record after fetching from database.
   * According to AdminForth convention, if {@link AdminForthResourceColumn.type} is set to {@link AdminForthDataTypes.DATETIME} then it should be transformed to ISO string.
   * @param field 
   * @param value 
   */
  getFieldValue(field: AdminForthResourceColumn, value: any): any;

  /**
   * Used to transform record before saving to database. Should perform operation inverse to {@link IAdminForthDataSourceConnector.getFieldValue}
   * @param field 
   * @param value 
   */
  setFieldValue(field: AdminForthResourceColumn, value: any): any;

  /**
   * Used to fetch data from database.
   * This method is reused both to list records and show one record (by passing limit 1 and offset 0) .
   * 
   * Fields are returned from db "as is" then {@link AdminForthBaseConnector.getData} will transform each field using {@link IAdminForthDataSourceConnector.getFieldValue}
   */
  getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: {
    resource: AdminForthResource,
    limit: number,
    offset: number,
    sort: IAdminForthSort[], 
    filters: IAdminForthFilter[],
  }): Promise<Array<any>>;

  /**
   * Used to get count of records in database.
   */
  getCount({ resource, filters }: {
    resource: AdminForthResource,
    filters: IAdminForthFilter[],
  }): Promise<number>;

  /**
   * Optional method which used to get min and max values for columns in resource.
   * Called only for columns which have {@link AdminForthResourceColumn.allowMinMaxQuery} set to true.
   * 
   * Internally should call {@link IAdminForthDataSourceConnector.getFieldValue} for both min and max values.
   */
  getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }>;


  /**
   * Used to create record in database.
   */
  createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }): Promise<void>;

  /**
   * Used to update record in database.
   * recordId is value of field which is marked as {@link AdminForthResourceColumn.primaryKey}
   * newValues is array of fields which should be updated (might be not all fields in record, but only changed fields).
   */
  updateRecord({ resource, recordId, newValues }:
    { resource: AdminForthResource, recordId: string, newValues: any }
  ): Promise<void>;
  
  /**
   * Used to delete record in database.
   */
  deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }): Promise<boolean>;
}


/**
 * Interface that exposes methods to interact with AdminForth in standard way
 */
export interface IAdminForthDataSourceConnectorBase extends IAdminForthDataSourceConnector {

  getPrimaryKey(resource: AdminForthResource): string;

  getData({ resource, limit, offset, sort, filters }: {
    resource: AdminForthResource,
    limit: number,
    offset: number,
    sort: IAdminForthSort[],
    filters: IAdminForthFilter[],
    getTotals?: boolean,
  }): Promise<{ data: Array<any>, total: number }>;

  getRecordByPrimaryKey(resource: AdminForthResource, recordId: string): Promise<any>;

  createRecord({ resource, record, adminUser }: { 
    resource: AdminForthResource, 
    record: any 
    adminUser: AdminUser
  }): Promise<{ok: boolean, error?: string, createdRecord?: any}>;

  getMinMaxForColumns({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }>;
}


export interface IAdminForthDataSourceConnectorConstructor {
  new ({ url }: { url: string }): IAdminForthDataSourceConnector;
}

export interface IAdminForthAuth {
  verify(jwt : string, mustHaveType: string, decodeUser?: boolean): Promise<any>;
  issueJWT(payload: Object, type: string, expiresIn?: string): string;

  removeCustomCookie({response, name}: {response: any, name: string}): void;

  setAuthCookie({expireInDays, response, username, pk,}: {expireInDays?: number, response: any, username: string, pk: string}): void;
  
  removeAuthCookie(response: any): void;
}

export interface IAdminForth {
  config: AdminForthConfig;
  codeInjector: ICodeInjector;
  express: IHttpServer;

  activatedPlugins: Array<IAdminForthPlugin>;

  baseUrlSlashed: string;

  statuses: {
    dbDiscover: 'running' | 'done',
  };

  connectors: {
    [key: string]: IAdminForthDataSourceConnectorBase;
  };

  createResourceRecord(
    params: { resource: AdminForthResource, record: any, adminUser: AdminUser }
  ): Promise<{ ok: boolean, error?: string, createdRecord?: any }>;

  auth: IAdminForthAuth;

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
   * Resource to get access to operational resources for data api fetching and manipulation.
   */
  resource(resourceId: string): IOperationalResource;

  /**
   * This method will be automatically called from AdminForth HTTP adapter to serve AdminForth SPA.
   */
  setupEndpoints(server: IHttpServer): void;
}


export interface IAdminForthPlugin {
  adminforth: IAdminForth;
  pluginDir: string;
  customFolderName: string;
  pluginInstanceId: string;
  customFolderPath: string;
  pluginOptions: any;
  resourceConfig: AdminForthResource;

  /**
   * Before activating all plugins are sorted by this number and then activated in order.
   * If you want to make sure that your plugin is activated after some other plugin, set this number to higher value. (default is 0)
   */
  activationOrder: number;


  /**
   * AdminForth plugins concept is based on modification of full AdminForth configuration
   * to add some custom functionality. For example plugin might simply add custom field to resource by reusing 
   * {@link AdminForthResourceColumn.components} object, then add some hook which will modify record before getting or saving it to database.
   * 
   * So this method is core of AdminForth plugins. It allows to modify full resource configuration.
   * @param adminforth Instance of IAdminForth
   * @param resourceConfig Resource configuration object which will be modified by plugin
   */
  modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource): void;
  componentPath(componentFile: string): string;

  /**
   * If plugin should support multiple installations per one resource, this function that should return unique string for each instance of plugin.
   * For example if plugin is installed for one column and this column defined as
   * `targetColumn` in plugin options, then this method should return `${pluginOptions.targetColumn}`.
   * 
   * If plugin should support only one installation per resource, option can return  'single'
   * @param pluginOptions - options of plugin
   */
  instanceUniqueRepresentation(pluginOptions: any) : string;


  /**
   * Optional method which will be called after AdminForth discovers all resources and their columns.
   * Can be used to validate types of columns, check if some columns are missing, etc.
   */
  validateConfigAfterDiscover?(adminforth: IAdminForth, resourceConfig: AdminForthResource): void;

  /**
   * Here you can register custom endpoints for your plugin.
   * 
   * @param server 
   */
  setupEndpoints(server: IHttpServer): void;
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

    /**
     * Optional callback which will be called before rendering the menu for each item.
     * Result of callback if not null will be used as a small badge near the menu item.
     */
    badge?: string | ((user: AdminUser) => Promise<string>),
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
    foreignResource?:AdminForthForeignResource,

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
export type BeforeSaveFunction = (params: {resource: AdminForthResource, recordId: any, adminUser: AdminUser, record: any}) => Promise<{ok: boolean, error?: string}>;

/**
 * Modify record to change how data is saved to database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type AfterSaveFunction = (params: {resource: AdminForthResource, recordId: any, adminUser: AdminUser, record: any}) => Promise<{ok: boolean, error?: string}>;

/**
 * Allow to get user data before login confirmation, will triger when user try to login.
 */
export type BeforeLoginConfirmationFunction = (params?: { 
    adminUser: AdminUser,
    response: IAdminForthHttpResponse,
}) => Promise<{
  ok:boolean, 
  error?:string, 
  body: {
    redirectTo?: string, 
    allowedLogin?: boolean,
  }
}>;


export type AdminForthBulkAction = {
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
   * Callback which will be called on backend when user clicks on action button.
   * It should return Promise which will be resolved when action is done.
   */
  action: ({ resource, selectedIds, adminUser }: { resource: AdminForthResource, selectedIds: Array<any>, adminUser: AdminUser }) => Promise<{ ok: boolean, error?: string, successMessage?: string }>,

  /**
   * Confirmation message which will be displayed to user before action is executed.
   */
  confirm?: string,

  /**
   * Success message which will be displayed to user after action is executed.
   */
  successMessage?: string,
  /**
   * Allowed callback called to check whether action is allowed for user.
   * 1. It called first time when user goes to list view. If callback returns false, action button will be hidden on list view.
   * 2. This same callback called second time when user clicks an action button. If callback returns false, action will not be executed.
   * In second time selectedIds will be passed to callback (because checkbox for items are selected), so you can use this to make additional 
   * checks ( for example to check if user has permission for certain records ).
   * 
   * Example:
   * 
   * ```ts
   * allowed: async ({ resource, adminUser, selectedIds }) => {
   *   if (adminUser.dbUser.role !== 'superadmin') {
   *    return false;
   *   } 
   *   return true;
   * }
   * ```
   * 
   */
  allowed?: ({ resource, adminUser, selectedIds, allowedActions }: {

    /**
     * recordIds will be passed only once user tries to perform bulk action by clicking on button
     */
    selectedIds?: Array<any>,
    resource: AdminForthResource,

    /**
     * Admin user object
     */
    adminUser: AdminUser,

    /**
     * Allowed standard actions for current user resolved by calling allowedActions callbacks if they are passed.
     * You can use this variable to rely on standard actions permissions. E.g. if you have custom actions "Mark as read", you 
     * might want to allow it only for users who have "edit" action allowed:
     * 
     * Example:
     * 
     * ```ts
     * 
     * options: \{
     *   bulkActions: [
     *     \{
     *       label: 'Mark as read',
     *       action: async (\{ resource, recordIds \}) => \{
     *         await markAsRead(recordIds);
     *       \},
     *       allowed: (\{ allowedActions \}) => allowedActions.edit,
     *     \}
     *   ],
     *   allowedActions: \{
     *     edit: (\{ resource, adminUser, recordIds \}) => \{
     *       return adminUser.dbUser.role === 'superadmin';
     *     \}
     *   \}
     * \}
     * ```
     * 
     */
    allowedActions: AllowedActionsResolved,
    }) => Promise<boolean>,
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
    columns: Array<AdminForthResourceColumn>,

    /**
     * Internal array of columns which are not virtual. You should not edit it. 
     */
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
    plugins?: Array<IAdminForthPlugin>,

    /**
     * Hooks allow you to change the data on different stages of resource lifecycle.
     * Hooks are functions which will be called on backend side (only backend side).
     */
    hooks?: {
      show?: {
        /**
         * Typical usecases: 
         * - request additional data from database before returning to frontend for soft-join 
         */
        beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,

        /**
         * Typical usecases:
         * - Transform value for some field for record returned from database before returning to frontend (minimize, sanitize, etc)
         * - If some-why you can't use `backendOnly` you can cleanup sensitive fields here
         * - Attach additional data to record before returning to frontend 
         */
        afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
      },
      list?: {
        /**
         * Typical usecases:
         * - add additional filters in addition to what user selected before fetching data from database.
         * - same as hooks.show.beforeDatasourceRequest 
         */
        beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,

        /**
         * Typical usecases:
         * - Same as hooks.show.afterDatasourceResponse but applied for each record in list
         */
        afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
      },
      create?: {
        /**
         * Typical usecases:
         * - Validate record before saving to database and interrupt execution if validation failed (`allowedActions.create` should be preferred in most cases)
         * - fill-in adminUser as creator of record
         * - Attach additional data to record before saving to database (mostly fillOnCreate should be used instead)
         */
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,

        /**
         * Typical usecases:
         * - Initiate some trigger after record saved to database (e.g sync to another datasource)
         */
        afterSave?: AfterSaveFunction | Array<AfterSaveFunction>,
      },
      edit?: {
        /**
         * Typical usecases:
         * - Same as hooks.create.beforeSave but for edit page
         */
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,

        /**
         * Typical usecases:
         * - Same as hooks.create.afterSave but for edit page
         */
        afterSave?: AfterSaveFunction | Array<AfterSaveFunction>,
      },
      delete?: {
        /**
         * Typical usecases:
         * - Validate that record can be deleted and interrupt execution if validation failed (`allowedActions.delete` should be preferred in most cases)
         */
        beforeSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
        /**
         * Typical usecases:
         * - Initiate some trigger after record deleted from database (e.g sync to another datasource)
         */
        afterSave?: BeforeSaveFunction | Array<BeforeSaveFunction>,
      },
    },

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
      bulkActions?: AdminForthBulkAction[],

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
          threeDotsDropdownItems?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
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
     * Authorization module configuration
     */
    auth?: {
      /**
       * Resource ID for resource which stores user table.
       * Resource is a table in database where users will be stored and fetched from. Resources and their ids are defined in resources section of the config.
       * In other words this setting is a reference to a table in database where users will be fetched from on login. 
       */
      usersResourceId?: string,

      /**
       * Legacy field left for backward compatibility. Use usersResourceId instead.
       */
      resourceId?: string,

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
       * Position of background image on login page
       * 'over' - image will be displayed over full login page under login form
       * '1/2' - image will be displayed on left 1/2 of login page
       * 
       * Default: '1/2'
       */
      loginBackgroundPosition?: 'over' | '1/2' | '1/3' | '2/3' | '3/4' | '2/5' | '3/5',

      /**
       * Function or functions  which will be called before user try to login.
       * Each function will resive User object as an argument
       */
      beforeLoginConfirmation?: BeforeLoginConfirmationFunction | Array<BeforeLoginConfirmationFunction>,

      /**
       * Optionally if your users table has a field(column) with full name, you can set it here.
       * This field will be used to display user name in the top right corner of the admin panel.
       */
      userFullNameField?: string,

      /**
       * Pair of login and pass substitution for demo mode. Split by ':'
       * ! This option is for demo purposes only, never use it for your projects
       */
      demoCredentials?: string,

      /**
       * Any prompt to show users on login. Supports HTML.
       */
      loginPromptHTML?: string,

      /**
       * Remember me days for "Remember Me" checkbox on login page.
       * If not set or set to null/0/undefined, "Remember Me" checkbox will not be displayed.
       * If rememberMeDays is set, then users who check "Remember Me" will be staying logged in for this amount of days.
       */
      rememberMeDays?: number,
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
    databaseConnectors?: {
        [key: string]: IAdminForthDataSourceConnectorConstructor,
    }, 

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
       * Whether to show brand name in sidebar
       * default is true
       */
      showBrandNameInSidebar?: boolean,

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
       * Path to your app favicon
       * 
       * Example: 
       * Place file `favicon.png` to `./custom` folder and set this option:
       * 
       * ```ts
       * favicon: '@@/favicon.png',
       * ```
       */
      favicon?: string,

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
       * export default function (app) {
       *    app.use(HighchartsVue);
       * }
       * ```
       * 
       * Install HighCharts into custom folder:
       * 
       * ```bashcreating rec
       * cd custom
       * npm init -y
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
        /** 
       * Object to redefine default styles for AdminForth components.  Use this file as reference for all possible adjustments https://github.com/devforth/adminforth/blob/main/adminforth/modules/styles.ts
       */
      styles?: Object,

      /**
       * Description of custom pages which will let register custom pages for custom routes in AdminForth.
       */
      customPages?: Array<{
        path: string,
        component: AdminForthComponentDeclaration,
      }>,

      /**
       * Function to return custom badge in side bar for users. Can return text or html
       * If function is not passed or returns null, badge will not be shown.
       * Execution is done on admin app load. 
       */
      announcementBadge?: (user: AdminUser) => { text?: string, html?: string, closable?: boolean, title?: string } | null,
      
      /**
       * Custom panel components or array of components which will be displayed in the login form 
       * right after the inputs. Use it to add custom authorization methods like social login or other custom fields e.g. 'reset' 
       * password link.
       */
      loginPageInjections?: {
        underInputs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
      }
    }

    /**
     * If you want to Serve AdminForth from a subdirectory, e.g. on example.com/backoffice, you can specify it like:
     * 
     * ```ts
     * baseUrl: '/backoffice',
     * ```
     * 
     */
    baseUrl?: string,
    
    
    /**
     * Whether to show delete confirmation dialog before deleting record.
     * By default it is true.
     */
    deleteConfirmation?: boolean,
    
   
}

// define typescript objects which I can instantiate as Filters.EQ(field, value) and they woudl
// return { field: field, operator: 'eq', value: value }. They should be exported with Filters namespace so I can import Filters from this file
// and use Filters.EQ(field, value) in my code

export type FDataFilter = (field: string, value: any) => IAdminForthFilter;

export class Filters {
  static EQ(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.EQ, value };
  }
  static NEQ(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.NE, value };
  }
  static GT(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.GT, value };
  }
  static GTE(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.GTE, value };
  }
  static LT(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.LT, value };
  }
  static LTE(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.LTE, value };
  }
  static IN(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.IN, value };
  }
  static NOT_IN(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.NIN, value };
  }
  static LIKE(field: string, value: any): IAdminForthFilter {
    return { field, operator: AdminForthFilterOperators.LIKE, value };
  }
}

export type FDataSort = (field: string, direction: AdminForthSortDirections) => IAdminForthSort;

export class Sorts {
  static ASC(field: string): IAdminForthSort {
    return { field, direction: AdminForthSortDirections.asc };
  }
  static DESC(field: string): IAdminForthSort {
    return { field, direction: AdminForthSortDirections.desc };
  }
}

export interface IOperationalResource {
  get: (filter: IAdminForthFilter | IAdminForthFilter[]) => Promise<any | null>;

  list: (filter: IAdminForthFilter | IAdminForthFilter[], limit: number, offset: number, sort: IAdminForthSort | IAdminForthSort[]) => Promise<any[]>;

  count: (filter: IAdminForthFilter | IAdminForthFilter[] | undefined) => Promise<number>;

  create: (record: any) => Promise<{ ok: boolean; createdRecord: any; error?: string; }>;

  update: (primaryKey: any, record: any) => Promise<any>;

  delete: (primaryKey: any) => Promise<boolean>;
}
  

export enum AllowedActionsEnum {
  show = 'show',
  list = 'list',
  edit = 'edit',
  create = 'create',
  delete = 'delete',
  filter = 'filter',
}

/**
 * Defines whether user has access to an action, can statically be Boolean
 * or function which returns Boolean or string with error message
 * 
 */
export type AllowedActionValue = boolean | (({adminUser, resource, meta, source}: {
  adminUser: AdminUser,
  resource: AdminForthResource,

  /**
   * Meta object which will pass request information just in case
   */
  meta: any,

  /**
   * Source of the check
   */
  source: ActionCheckSource,
}) => Promise<boolean | string>);

export enum ActionCheckSource {
  DisplayButtons = 'displayButtons',
  ListRequest = 'listRequest',
  ShowRequest = 'showRequest',
  EditRequest = 'editRequest',
  CreateRequest = 'createRequest',
  DeleteRequest = 'deleteRequest',
  BulkActionRequest = 'bulkActionRequest',
}

/**
 * Object which describes allowed actions for user.
 */
export type AllowedActions = {
  [key in AllowedActionsEnum]?: AllowedActionValue
} & {
  all?: AllowedActionValue;
}
  
export type AllowedActionsResolved = {
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

export type AdminForthFieldComponents = {
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

