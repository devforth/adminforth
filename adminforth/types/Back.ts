import type { Express, Request } from 'express';
import type { Writable } from 'stream';

import { ActionCheckSource, AdminForthFilterOperators, AdminForthSortDirections, AllowedActionsEnum, AdminForthResourcePages,
  type AdminForthComponentDeclaration, 
  type AdminForthResourceCommon, 
  type AdminUser, type AllowedActionsResolved, 
  type AdminForthBulkActionCommon, 
  type AdminForthForeignResourceCommon,
  type AdminForthResourceColumnCommon,
  type AdminForthResourceInputCommon,
  type AdminForthComponentDeclarationFull,
  type AdminForthConfigMenuItem,
  type AnnouncementBadgeResponse,
  type AdminForthResourceColumnInputCommon,
} from './Common.js';

export interface ICodeInjector {
  srcFoldersToSync: Object;
  allComponentNames: Object;
  devServerPort: number;

  getServeDir(): string;
  registerCustomComponent(filePath: string): void;
  spaTmpPath(): string;
}

export interface IConfigValidator {
  validateConfig(): void;
  validateAfterPluginsActivation(): void;
  postProcessAfterDiscover(resource: AdminForthResource): void;
}

export interface IAdminForthHttpResponse {
    setHeader: (key: string, value: string) => void,
    setStatus: (code: number, message: string) => void,
    blobStream: () => Writable,
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
      headers: {[key: string]: string}, 
      cookies: {[key: string]: string}, 
      response: IAdminForthHttpResponse,
    ) => void,
  }): void;

}


export interface IExpressHttpServer extends IHttpServer {

  /**
   * Call this method to serve AdminForth SPA from Express instance.
   * @param app : Express instance
   */
  serve(app: Express): void;

  /**
   * Method to start listening on port.
   */
  listen(port: number, callback: Function): void;
  listen(port: number, host: string, callback: Function): void;

  /**
   * Method (middleware) to wrap express endpoints with authorization check.
   * Adds adminUser to request object if user is authorized. Drops request with 401 status if user is not authorized.
   * @param callable : Function which will be called if user is authorized.
   * 
   * 
   * @example
   * ```ts
   * expressApp.get('/myApi', authorize((req, res) => {
   *  console.log('User is authorized', req.adminUser);
   *  res.json({ message: 'Hello World' });
   * }));
   * ```
   * 
   */  
  authorize(callable: Function): void;
}

export interface ITranslateFunction {
  (
    msg: string,
    category: string,
    params: any,
    pluralizationNumber?: number
  ): Promise<string>;
}

// Omit <Request, 'param'> is used to remove 'param' method from Request type for correct docs generation
export interface IAdminUserExpressRequest extends Omit<Request, 'protocol' | 'param' | 'unshift'> {
  adminUser: AdminUser;
}

export interface ITranslateExpressRequest extends Omit<Request, 'protocol' | 'param' | 'unshift'> {
  tr: ITranslateFunction;
}

export interface IAdminForthSingleFilter {
  field?: string;
  operator?: AdminForthFilterOperators.EQ | AdminForthFilterOperators.NE
  | AdminForthFilterOperators.GT | AdminForthFilterOperators.LT | AdminForthFilterOperators.GTE
  | AdminForthFilterOperators.LTE | AdminForthFilterOperators.LIKE | AdminForthFilterOperators.ILIKE
  | AdminForthFilterOperators.IN | AdminForthFilterOperators.NIN | AdminForthFilterOperators.IS_EMPTY | AdminForthFilterOperators.IS_NOT_EMPTY;
  value?: any;
  rightField?: string;
  insecureRawSQL?: string;
  insecureRawNoSQL?: any;
}
export interface IAdminForthAndOrFilter {
  operator: AdminForthFilterOperators.AND | AdminForthFilterOperators.OR;
  subFilters: Array<IAdminForthAndOrFilter | IAdminForthSingleFilter>
}

export interface IAdminForthSort {
  field: string, 
  direction: AdminForthSortDirections 
}

export interface IAdminForthDataSourceConnector {

  client: any;

  /**
   * Function to setup client connection to database.
   * @param url URL to database. Examples: clickhouse://demo:demo@localhost:8125/demo
   */
  setupClient(url: string): Promise<void>;
  
  /**
   * Function to get all tables from database.
   */
  getAllTables(): Promise<Array<string>>;

  /**
   * Function to get all columns in table.
   */
  getAllColumnsInTable(tableName: string): Promise<Array<{ name: string; type?: string; isPrimaryKey?: boolean; sampleValue?: any; }>>;
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
    filters: IAdminForthAndOrFilter,
  }): Promise<Array<any>>;

  /**
   * Used to get count of records in database.
   */
  getCount({ resource, filters }: {
    resource: AdminForthResource,
    filters: IAdminForthAndOrFilter,
  }): Promise<number>;

  /**
   * Optional method which used to get min and max values for columns in resource.
   * Called only for columns which have {@link AdminForthResourceColumn.allowMinMaxQuery} set to true.
   * 
   * Internally should call {@link IAdminForthDataSourceConnector.getFieldValue} for both min and max values.
   */
  getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }>;


  /**
   * Used to create record in database. Should return value of primary key column of created record.
   */
  createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }): Promise<string>;

  /**
   * Update record in database. newValues might have not all fields in record, but only changed ones.
   * recordId is value of field which is marked as {@link AdminForthResourceColumn.primaryKey}
   */
  updateRecordOriginalValues({ resource, recordId, newValues }: { resource: AdminForthResource; recordId: string; newValues: any; }): Promise<void>;

  /**
   * Used to delete record in database.
   */
  deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }): Promise<boolean>;
}


/**
 * Interface that exposes methods to interact with AdminForth in standard way
 */
export interface IAdminForthDataSourceConnectorBase extends IAdminForthDataSourceConnector {

  validateAndNormalizeInputFilters(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): IAdminForthAndOrFilter;

  getPrimaryKey(resource: AdminForthResource): string;

  getData({ resource, limit, offset, sort, filters }: {
    resource: AdminForthResource,
    limit: number,
    offset: number,
    sort: IAdminForthSort[],
    filters: IAdminForthAndOrFilter,
    getTotals?: boolean,
  }): Promise<{ data: Array<any>, total: number }>;

  getRecordByPrimaryKey(resource: AdminForthResource, recordId: string): Promise<any>;

  createRecord({ resource, record, adminUser }: { 
    resource: AdminForthResource, 
    record: any 
    adminUser: AdminUser,
  }): Promise<{ok: boolean, error?: string, createdRecord?: any}>;

  updateRecord({ resource, recordId, newValues }: { 
    resource: AdminForthResource, 
    recordId: string, 
    newValues: any, 
  }): Promise<{ok: boolean, error?: string}>;

  getMinMaxForColumns({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }>;
}


export interface IAdminForthDataSourceConnectorConstructor {
  new (): IAdminForthDataSourceConnectorBase;
}

export interface IAdminForthAuth {
  verify(jwt : string, mustHaveType: string, decodeUser?: boolean): Promise<any>;

  issueJWT(payload: Object, type: string, expiresIn?: string | number): string;

  removeCustomCookie({response, name}: {response: any, name: string}): void;

  setCustomCookie({response, payload}: {response: any, payload: {name: string, value: string, expiry?: number, expirySeconds: number, httpOnly: boolean}}): void;

  getCustomCookie({cookies, name}: {cookies: {key: string, value: string}[], name: string}): string | null;

  setAuthCookie({expireInDuration, response, username, pk,}: {expireInDuration?: string, response: any, username: string, pk: string}): void;
  
  removeAuthCookie(response: any): void;

  getClientIp(headers: any): string;
}

export interface IAdminForthRestAPI {

  /**
   * Called by AdminForth to initialize all endpoints for REST API.
   */
  registerEndpoints(server: IHttpServer): void;

  /**
   * Called by login endpoint to process login callbacks. Also might be called by plugins, to prevent action if user is not allowed to login.
   * For example signup or login via google might want to check if user is allowed to login by calling this method.
   * @param adminUser - plugin/af pases current adminUser
   * @param toReturn - this is an object which will get status of login process. If at least one callback returns error or redirectTo, login process will be stopped (future callbacks will not be called).
   * @param response - http response object
   * @param sessionDuration - duration of session in format "1s", "1m", "1h", or "1d" (e.g., "30d" for 30 days)
   */
  processLoginCallbacks(adminUser: AdminUser, toReturn: { redirectTo?: string, allowedLogin: boolean, error?: string }, response: any, extra: HttpExtra, sessionDuration?: string): Promise<void>;
}

export interface IAdminForth {
  config: AdminForthConfig;
  codeInjector: ICodeInjector;
  express: IHttpServer;

  restApi: IAdminForthRestAPI;
  activatedPlugins: Array<IAdminForthPlugin>;


  websocket: IWebSocketBroker;

  statuses: {
    dbDiscover: 'running' | 'done',
  };

  connectors: {
    [key: string]: IAdminForthDataSourceConnectorBase;
  };

  formatAdminForth(): string;
  
  tr(msg: string, category: string, lang: string, params: any, pluralizationNumber?: number): Promise<string>;

  createResourceRecord(
    params: CreateResourceRecordParams,
  ): Promise<CreateResourceRecordResult>;

  updateResourceRecord(
    params: UpdateResourceRecordParams,
  ): Promise<UpdateResourceRecordResult>;

  deleteResourceRecord(
    params: DeleteResourceRecordParams,
  ): Promise<DeleteResourceRecordResult>;

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

  /**
   * This method can be used when you want to get some plugin instances by class name.
   * Should be used for plugins which might have multiple instances with the same class name.
   * @param className - name of class which is used to identify plugin instance
   */
  getPluginsByClassName<T>(className: string): T[];

  /**
   * This method can be used when you want to get some plugin instance by class name.
   * Should be called only if you are sure there is only one plugin instance with this class name.
   * If several instances are found, this method will drop error.
   * @param className - name of class which is used to identify plugin instance
   * 
   * Example:
   * 
   * ```ts
   * const i18nPlugin = adminforth.getPluginByClassName\<I18nPlugin\>('I18nPlugin');
   * ```
   * 
   */
  getPluginByClassName<T>(className: string): T;

  /**
   *This method can be used when you want to get a plugin instance by its unique identifier.
   * @param id - unique id of the plugin instance (custom identifier passed when registering/configuring the plugin)
   * 
   * Example:
   * ```ts
   * const auditLog = adminforth.getPluginById&lt;AuditLogPlugin&gt;('AuditLogPlugin');
   * ```
   */
  getPluginById<T>(id: string): T;
}


export interface IAdminForthPlugin {
  adminforth: IAdminForth;
  pluginDir: string;
  customFolderName: string;
  pluginInstanceId: string;
  customFolderPath: string;
  pluginOptions: any;
  resourceConfig: AdminForthResource;
  className: string;

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
  modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource, allPluginInstances?: {pi: IAdminForthPlugin, resource: AdminForthResource}[]): void;
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
   * If this method returns true, AdminForth will allow only one instance of plugin per whole app
   * (only for case when we are creating copy of resource and activating plugins)
   * If false, multiple instances of plugin can be installed on different resources.
   */
  shouldHaveSingleInstancePerWholeApp?(): boolean;

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


/**
 * Modify query to change how data is fetched from database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type BeforeDataSourceRequestFunction = (params: {
  resource: AdminForthResource, 
  adminUser: AdminUser, 
  query: any, 
  extra: {
    body: any,
    query: Record<string, string>,
    headers: Record<string, string>,
    cookies: Record<string, string>,
    requestUrl: string,
  },
  adminforth: IAdminForth,
}) => Promise<{
  ok: boolean, 
  error?: string | null, 
  /**
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use redirectToRecordId instead.
   */
  newRecordId?: string, 
  redirectToRecordId?: string
}>;

/**
 * Modify response to change how data is returned after fetching from database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type AfterDataSourceResponseFunction = (params: {
  resource: AdminForthResource, 
  adminUser: AdminUser, 
  query: any,
  response: any, 
  extra: {
    body: any,
    query: Record<string, string>,
    headers: Record<string, string>,
    cookies: { key: string, value: string }[],
    requestUrl: string,
  },
  adminforth: IAdminForth,
}) => Promise<{ok: boolean, error?: string}>;

export interface HttpExtra {
  body: any,
  query: Record<string, string>,
  headers: Record<string, string>,
  cookies: Record<string, string>,
  requestUrl: string,
  meta?: any,
  response: IAdminForthHttpResponse
}

/**
 * Result of {@link IAdminForth.createResourceRecord}.
 */
export type CreateResourceRecordResult = {
  /** Optional error message if creation failed. */
  error?: string;

  /** Created record as returned from the connector. */
  createdRecord?: any;

  /**
   * Optional id of an existing record to redirect to
   * (used when a beforeSave hook aborts creation and supplies newRecordId, allows to implement programmatic creation via API).
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use redirectToRecordId instead.
   */
  newRecordId?: any;

  /**
   * Optional id of an existing record to redirect to
   * (used when a beforeSave hook aborts creation and supplies redirectToRecordId, allows to implement programmatic creation via API).
   */
  redirectToRecordId?: any;
};

/**
 * Parameters for {@link IAdminForth.createResourceRecord}.
 */
export type CreateResourceRecordParams = {
  /**
   * Resource configuration used to create a record.
   */
  resource: AdminForthResource;

  /**
   * Record data to create.
   */
  record: any;

  /**
   * Admin user performing the action.
   */
  adminUser: AdminUser;

  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response?: IAdminForthHttpResponse;

  /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra;
};

/**
 * Parameters for {@link IAdminForth.updateResourceRecord}.
 */
export type UpdateResourceRecordParams =
  | {
      /**
       * Resource configuration used to update a record.
       */
      resource: AdminForthResource;

      /**
       * Primary key value of the record to update.
       */
      recordId: any;

      /**
       * Full record data with applied changes.
       *
       * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use updates instead.
       */
      record: any;

      /**
       * Record data before update.
       */
      oldRecord: any;

      /**
       * Admin user performing the action.
       */
      adminUser: AdminUser;

      /**
       * HTTP response object.
       *
       * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
       */
      response?: IAdminForthHttpResponse;

      /**
       * Extra HTTP information. Prefer using extra.response over the top-level response field.
       */
      extra?: HttpExtra;

      /**
       * Partial record data with only changed fields. Mutually exclusive with record.
       */
      updates?: never;
    }
  | {
      /**
       * Resource configuration used to update a record.
       */
      resource: AdminForthResource;

      /**
       * Primary key value of the record to update.
       */
      recordId: any;

      /**
       * Full record data with applied changes.
       *
       * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use updates instead.
       */
      record?: never;

      /**
       * Record data before update.
       */
      oldRecord: any;

      /**
       * Admin user performing the action.
       */
      adminUser: AdminUser;

      /**
       * HTTP response object.
       *
       * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
       */
      response?: IAdminForthHttpResponse;

      /**
       * Extra HTTP information. Prefer using extra.response over the top-level response field.
       */
      extra?: HttpExtra;

      /**
       * Partial record data with only changed fields. Mutually exclusive with record.
       */
      updates: any;
    };

/**
 * Parameters for {@link IAdminForth.deleteResourceRecord}.
 */
export type DeleteResourceRecordParams = {
  /**
   * Resource configuration used to delete a record.
   */
  resource: AdminForthResource;

  /**
   * Primary key value of the record to delete.
   */
  recordId: string;

  /**
   * Admin user performing the action.
   */
  adminUser: AdminUser;

  /**
   * Record data before deletion.
   */
  record: any;

  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response?: IAdminForthHttpResponse;

  /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra;
};

/**
 * Result of {@link IAdminForth.updateResourceRecord}.
 */
export type UpdateResourceRecordResult = {
  /** Optional error message if update failed. */
  error?: string;
};

/**
 * Result of {@link IAdminForth.deleteResourceRecord}.
 */
export type DeleteResourceRecordResult = {
  /** Optional error message if delete failed. */
  error?: string;
};
/**
 * Modify record to change how data is saved to database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type BeforeDeleteSaveFunction = (params: {
  /**
   * Resource info.
   */
  resource: AdminForthResource, 
  /**
   * Primary key value of the record to delete.
   */
  recordId: any, 
  /**
   * Admin user performing the action.
   */
  adminUser: AdminUser,
  /**
   * Record data before deletion.
   */
  record: any, 
  /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response?: IAdminForthHttpResponse,
  /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra,
}) => Promise<{ok: boolean, error?: string}>;


export type BeforeEditSaveFunction = (params: {
    /**
   * Resource info.
   */
  resource: AdminForthResource, 
    /**
   * Primary key value of the record to delete.
   */
  recordId: any, 
    /**
   * Admin user performing the action.
   */
  adminUser: AdminUser, 
  /*
  * Fields to update in record.
  */
  updates: any,
  /** 
  * Record with updates
  *
  *  @deprecated. Will be removed in 2.0.0. Use updates instead.
  */
  record: any, // legacy, 'updates' should be used instead
  /**
   * Record data before update.
   */
  oldRecord: any,
  /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
    /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response: IAdminForthHttpResponse,
    /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra,
}) => Promise<{ok: boolean, error?: string | null}>;

export type BeforeCreateSaveFunction = (params: {
  /**
   * Resource info.
   */
  resource: AdminForthResource, 
  /**
   * Admin user performing the action.
   */
  adminUser: AdminUser, 
  /**
  * Record data to create.
  */
  record: any, 
  /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response: IAdminForthHttpResponse,

  extra?: HttpExtra,
}) => Promise<{
  ok: boolean, 
  error?: string | null, 
  /**
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use redirectToRecordId instead.
   */
  newRecordId?: string, 
  redirectToRecordId?: string
}>;

export type AfterCreateSaveFunction = (params: {
    /**
   * Resource info.
   */
  resource: AdminForthResource, 
    /**
   * Primary key value of the record to delete.
   */
  recordId: any, 
    /**
   * Admin user performing the action.
   */
  adminUser: AdminUser, 
  /**
   * Record data after creation.
   */
  record: any, 
    /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
  /**
   * Record with virtual columns after creation.
   */
  recordWithVirtualColumns?: any,
  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response: IAdminForthHttpResponse,
    /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra,
}) => Promise<{ok: boolean, error?: string}>;

/**
 * Modify record to change how data is saved to database.
 * Return ok: false and error: string to stop execution and show error message to user. Return ok: true to continue execution.
 */
export type AfterDeleteSaveFunction = (params: {
    /**
   * Resource info.
   */
  resource: AdminForthResource, 
    /**
   * Primary key value of the record to delete.
   */
  recordId: any, 
    /**
   * Admin user performing the action.
   */
  adminUser: AdminUser, 
  /**
   * Record data, that was deleted.
   */
  record: any, 
  /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response: IAdminForthHttpResponse,
    /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra,
}) => Promise<{ok: boolean, error?: string}>;


export type AfterEditSaveFunction = (params: {
    /**
   * Resource info.
   */
  resource: AdminForthResource, 
    /**
   * Primary key value of the record to delete.
   */
  recordId: any, 
    /**
   * Admin user performing the action.
   */
  adminUser: AdminUser,
  /**
  * Record updates.
  */
  updates: any, 
  /** 
  * Record after update.
  *
  *  @deprecated. Will be removed in 2.0.0. Use updates instead.
  */
  record: any, // legacy, 'updates' should be used instead 
  /**
   * Record data before update.
   */
  oldRecord: any,
  /**
   * Adminforth instance.
   */
  adminforth: IAdminForth,
  /**
   * HTTP response object.
   *
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
   */
  response: IAdminForthHttpResponse,
    /**
   * Extra HTTP information. Prefer using extra.response over the top-level response field.
   */
  extra?: HttpExtra,
}) => Promise<{ok: boolean, error?: string}>;

/**
 * Allow to get user data before login confirmation, will triger when user try to login.
 */
export type BeforeLoginConfirmationFunction = (params?: { 
    /**
   * Admin user performing the action.
   */
    adminUser: AdminUser,
    /**
     * HTTP response object.
     *
     * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
     */
    response: IAdminForthHttpResponse,
    /**
     * Adminforth instance.
     */
    adminforth: IAdminForth,
      /**
     * Extra HTTP information. Prefer using extra.response over the top-level response field.
     */
    extra?: HttpExtra,
      /**
     * Duration of session in format "1s", "1m", "1h", or "1d" (e.g., "30d" for 30 days)
     */
    sessionDuration?: string,
}) => Promise<{
  error?: string, 
  body: {
    redirectTo?: string, 
    allowedLogin?: boolean,
  }
}>;

/**
 * Allow to make extra authorization
 */
export type AdminUserAuthorizeFunction = ((params?: { 
    /**
   * Admin user performing the action.
   */
    adminUser: AdminUser,
      /**
     * HTTP response object.
     *
     * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use extra.response instead.
     */
    response: IAdminForthHttpResponse,
    /**
     * Adminforth instance.
     */
    adminforth: IAdminForth,
      /**
     * Extra HTTP information. Prefer using extra.response over the top-level response field.
     */
    extra?: HttpExtra,
}) => Promise<{
  error?: string,
  allowed?: boolean,
}>);

  
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

type AdminForthPageDeclaration = {
  path: string,
  component: AdminForthComponentDeclaration,
}

interface AdminForthInputConfigCustomization {
  /**
   * Your app name
   */
  brandName?: string,

  /**
   * Whether to use single theme for the app
   */
  singleTheme?: 'light' | 'dark',

  /**
   * Whether to show brand name in sidebar
   * default is true
   */
  showBrandNameInSidebar?: boolean,

  /**
   * Whether to show brand logo in sidebar
   * default is true
   */
  showBrandLogoInSidebar?: boolean,

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
   * Path to your app logo for icon only sidebar
   * 
   * Example:
   * Place file `logo.svg` to `./custom` folder and set this option:
   * 
   */
  iconOnlySidebar?: {
    logo?: string,
    enabled?: boolean,
    /**
     * Width of expanded sidebar (default: '16.5rem')
     */
    expandedSidebarWidth?: string,
  },

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
   * DayJS format string for all dates in the app.
   * Defaulted to 'MMM D, YYYY'
   */
  datesFormat?: string,

  /**
   * DayJS format string for all datetimes in the app.
   * Defaulted to 'HH:mm:ss'
   */
  timeFormat?: string,

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
  customPages?: Array<AdminForthPageDeclaration>,

  /**
   * Function to return custom badge in side bar for users. Can return text or html
   * If function is not passed or returns null, badge will not be shown.
   * Execution is done on admin app load. 
   */
  announcementBadge?: (user: AdminUser) => AnnouncementBadgeResponse,
  
  /**
   * Custom panel components or array of components which will be displayed in the login form 
   * right after the inputs. Use it to add custom authorization methods like social login or other custom fields e.g. 'reset' 
   * password link.
   */
  loginPageInjections?: {
    underInputs?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    underLoginButton?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    panelHeader?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
  }

  /**
   * Custom panel components or array of components which will be displayed in different parts of the admin panel.
   */
  globalInjections?: {
    userMenu?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    header?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    sidebar?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    sidebarTop?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    everyPageBottom?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
  }

  /**
  * Allows adding custom elements (e.g., &lt;link&gt;, &lt;script&gt;, &lt;meta&gt;) to the &lt;head&gt; of the HTML document.
  * Each item must include a tag name and a set of attributes.
  */
  customHeadItems?: {
    tagName: string;
    attributes: Record<string, string | boolean>;
    innerCode?: string;
  }[];

}

export interface AdminForthActionInput {
  name: string;
  showIn?: {
      list?: boolean,
      listThreeDotsMenu?: boolean,
      showButton?: boolean,
      showThreeDotsMenu?: boolean,
  };
  allowed?: (params: {
    adminUser: AdminUser;
    standardAllowedActions: AllowedActions;
  }) => boolean;
  url?: string;
  action?: (params: {
      adminforth: IAdminForth;
      resource: AdminForthResource;
      recordId: string;
      adminUser: AdminUser;
      response: IAdminForthHttpResponse;
      extra?: HttpExtra;
      tr: Function;
  }) => Promise<{
      ok: boolean;
      error?: string;
      message?: string;
  }>;
  icon?: string;
  id?: string;
  customComponent?: AdminForthComponentDeclaration;
}

export interface AdminForthResourceInput extends Omit<NonNullable<AdminForthResourceInputCommon>, 'columns' | 'hooks' | 'options'> {

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
       * Typical use-cases: 
       * - request additional data from database before returning to frontend for soft-join 
       */
      beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,

      /**
       * Typical use-cases:
       * - Transform value for some field for record returned from database before returning to frontend (minimize, sanitize, etc)
       * - If some-why you can't use `backendOnly` you can cleanup sensitive fields here
       * - Attach additional data to record before returning to frontend 
       */
      afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
    },
    list?: {
      /**
       * Typical use-cases:
       * - add additional filters in addition to what user selected before fetching data from database.
       * - same as hooks.show.beforeDatasourceRequest 
       */
      beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,

      /**
       * Typical use-cases:
       * - Same as hooks.show.afterDatasourceResponse but applied for all records returned from database for 
       * showing in list view, e.g. add new field to each record in list view
       */
      afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
    },
    create?: {
      /**
       * Typical use-cases:
       * - Validate record before saving to database and interrupt execution if validation failed (`allowedActions.create` should be preferred in most cases)
       * - fill-in adminUser as creator of record
       * - Attach additional data to record before saving to database (mostly fillOnCreate should be used instead)
       */
      beforeSave?: BeforeCreateSaveFunction | Array<BeforeCreateSaveFunction>,

      /**
       * Typical use-cases:
       * - Initiate some trigger after record saved to database (e.g sync to another datasource)
       */
      afterSave?: AfterCreateSaveFunction | Array<AfterCreateSaveFunction>,
    },
    edit?: {
      /**
       * Typical use-cases:
       * - Same as hooks.create.beforeSave but for edit page
       */
      beforeSave?: BeforeEditSaveFunction | Array<BeforeEditSaveFunction>,

      /**
       * Typical use-cases:
       * - Same as hooks.create.afterSave but for edit page
       */
      afterSave?: AfterEditSaveFunction | Array<AfterEditSaveFunction>,
    },
    delete?: {
      /**
       * Typical use-cases:
       * - Validate that record can be deleted and interrupt execution if validation failed (`allowedActions.delete` should be preferred in most cases)
       */
      beforeSave?: BeforeDeleteSaveFunction | Array<BeforeDeleteSaveFunction>,
      /**
       * Typical use-cases:
       * - Initiate some trigger after record deleted from database (e.g sync to another datasource)
       */
      afterSave?: BeforeDeleteSaveFunction | Array<BeforeDeleteSaveFunction>,
    },
  },

  options?: ResourceOptionsInput,

  columns: Array<AdminForthResourceColumnInput>,

  dataSourceColumns?: Array<AdminForthResourceColumn>,
}

/**
 * Main configuration object for AdminForth
 */
export interface AdminForthInputConfig {

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
       * If true, background blend mode will be removed from login background image when position is 'over'
       * 
       * Default: false
       */
      removeBackgroundBlendMode?: boolean,

      /**
       * Function or functions  which will be called before user try to login.
       * Each function will resive User object as an argument
       */
      beforeLoginConfirmation?: BeforeLoginConfirmationFunction | Array<BeforeLoginConfirmationFunction>,

      /**
       * Array of functions which will be called before any request to AdminForth API.
       */
      adminUserAuthorize?: AdminUserAuthorizeFunction | Array<AdminUserAuthorizeFunction>,

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
      loginPromptHTML?: string | (() => string | void | undefined | Promise<string | void | undefined>) | undefined 


      /**       
       * Function to return avatar URL for user.
       */
      avatarUrl?: ((adminUser: AdminUser) => string | Promise<string> | undefined | Promise<undefined>),

      /**
       * Remember me duration for "Remember Me" checkbox on login page.
       * If not set or set to null/undefined, "Remember Me" checkbox will not be displayed.
       * If rememberMeDuration is set, then users who check "Remember Me" will be staying logged in for this amount of time.
       * Format: "1s" (seconds), "1m" (minutes), "1h" (hours), or "1d" (days).
       * Example: "30d" for 30 days, "7d" for 7 days, "24h" for 24 hours.
       */ 
      rememberMeDuration?: string,

      /**
       * Old variable for remember me duration. Use rememberMeDuration instead.
       * @deprecated Use rememberMeDuration instead.
       */ 
      rememberMeDays?: number,


      /**
       * Can be used to limit user access when subscribing from frontend to websocket topics.
       * @param topic - topic where user is trying to subscribe
       * @param user - user object
       * @returns - boolean, true if user is allowed to subscribe to this topic, false otherwise
       */
      websocketTopicAuth?: (topic: string, user: AdminUser) => Promise<boolean>,

      /**
       * callback which will be called after user subscribes to websocket topic
       * @param topic - topic on which user subscribed
       * @param user - user object
       * @returns 
       */
      websocketSubscribed?: (topic: string, user: AdminUser) => void,

      /**
       * Client IP header name. If set, AdminForth will use this header to get client IP address.
       * Otherwise it will use first IP address from X-Forwarded-For header.
       * If you are using Cloudflare, set this to 'CF-Connecting-IP'. Case-insensitive.
       */
      clientIpHeader?: string,

      /**
       * Add custom page to the settings page
       */
      userMenuSettingsPages?: {
        icon?: string,
        pageLabel: string,
        slug?: string,
        component: string,
        isVisible?: (adminUser: AdminUser) => boolean,
      }[],
    },

     /**
      * Array of resources which will be displayed in the admin panel.
      * Resource represents one table or collection in database.
      * Each resource has its own configuration.
      */ 
    resources: Array<AdminForthResourceInput>,

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
    customization?: AdminForthInputConfigCustomization,

    /**
     * If you want to Serve AdminForth from a subdirectory, e.g. on example.com/backoffice, you can specify it like:
     * 
     * ```ts
     * baseUrl: '/backoffice',
     * ```
     * 
     */
    baseUrl?: string,
 
}


export interface AdminForthConfigCustomization extends Omit<AdminForthInputConfigCustomization, 'loginPageInjections' | 'globalInjections'> {
  brandName: string,

  dateFormats: string,
  timeFormat: string,
  
  /**
   * Slug which will be used on tech side e.g. to store cookies separately.
   * Created automatically from brandName if not set. 
   */
  brandNameSlug: string,
  showBrandNameInSidebar: boolean,
  customPages: Array<AdminForthPageDeclaration>,

  loginPageInjections: {
    underInputs: Array<AdminForthComponentDeclarationFull>,
    underLoginButton?: AdminForthComponentDeclaration | Array<AdminForthComponentDeclaration>,
    panelHeader: Array<AdminForthComponentDeclarationFull>,
  },

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
  }[];
  
}

export interface AdminForthConfig extends Omit<AdminForthInputConfig, 'customization' | 'resources'> {
  baseUrl: string;
  baseUrlSlashed: string;

  customization: AdminForthConfigCustomization,

  resources: Array<AdminForthResource>,

}


// define typescript objects which I can instantiate as Filters.EQ(field, value) and they woudl
// return { field: field, operator: 'eq', value: value }. They should be exported with Filters namespace so I can import Filters from this file
// and use Filters.EQ(field, value) in my code

export type FDataFilter = (field: string, value: any) => IAdminForthSingleFilter;

export class Filters {
  static EQ(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.EQ, value };
  }
  static NEQ(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.NE, value };
  }
  static GT(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.GT, value };
  }
  static GTE(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.GTE, value };
  }
  static LT(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.LT, value };
  }
  static LTE(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.LTE, value };
  }
  static IN(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.IN, value };
  }
  static NOT_IN(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.NIN, value };
  }
  static LIKE(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.LIKE, value };
  }
  static ILIKE(field: string, value: any): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.ILIKE, value };
  }
  static GT_FIELD(leftField: string, rightField: string): IAdminForthSingleFilter {
    return { field: leftField, operator: AdminForthFilterOperators.GT, rightField };
  }
  static GTE_FIELD(leftField: string, rightField: string): IAdminForthSingleFilter {
    return { field: leftField, operator: AdminForthFilterOperators.GTE, rightField };
  }
  static LT_FIELD(leftField: string, rightField: string): IAdminForthSingleFilter {
    return { field: leftField, operator: AdminForthFilterOperators.LT, rightField };
  }
  static LTE_FIELD(leftField: string, rightField: string): IAdminForthSingleFilter {
    return { field: leftField, operator: AdminForthFilterOperators.LTE, rightField };
  }
  static AND(
    ...args: (IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>)[]
  ): IAdminForthAndOrFilter {
    const subFilters =
      args.length === 1 && Array.isArray(args[0])
        ? args[0]
        : args as Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>;
  
    return {
      operator: AdminForthFilterOperators.AND,
      subFilters,
    };
  }
  static OR(
    ...args: (IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>)[]
  ): IAdminForthAndOrFilter {
    const subFilters =
      args.length === 1 && Array.isArray(args[0])
        ? args[0]
        : args as Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>;
  
    return {
      operator: AdminForthFilterOperators.OR,
      subFilters,
    };
  }

  static IS_EMPTY(field: string): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.IS_EMPTY, value: null };
  }

  static IS_NOT_EMPTY(field: string): IAdminForthSingleFilter {
    return { field, operator: AdminForthFilterOperators.IS_NOT_EMPTY, value: null };
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
  get: (filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>) => Promise<any | null>;

  list: (filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>, limit?: number, offset?: number, sort?: IAdminForthSort | IAdminForthSort[]) => Promise<any[]>;

  count: (filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>) => Promise<number>;

  create: (record: any) => Promise<{ ok: boolean; createdRecord: any; error?: string; }>;

  update: (primaryKey: any, record: any) => Promise<any>;

  delete: (primaryKey: any) => Promise<boolean>;

  dataConnector: IAdminForthDataSourceConnectorBase;
}



/**
 * Defines whether user has access to an action, can statically be Boolean
 * or function which returns Boolean or string with error message
 * 
 */
export type AllowedActionValue = boolean | (({adminUser, resource, meta, source, adminforth}: {
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

  /**
   * Instance of AdminForth, can be used e.g. to call data API adminforth.resource(resourceId)...
   */
  adminforth: IAdminForth,
}) => Promise<boolean | string>);


  
/**
 * Object which describes allowed actions for user.
 */
export type AllowedActionsInput = {
  [key in AllowedActionsEnum]?: AllowedActionValue
} & {
  all?: AllowedActionValue;
}

export type AllowedActions = {
  [key in AllowedActionsEnum]: AllowedActionValue
}

/**
 * General options for resource.
 */
export interface ResourceOptionsInput extends Omit<NonNullable<AdminForthResourceInputCommon['options']>, 'allowedActions' | 'bulkActions'> {

  baseActionsAsQuickIcons?: ('show' | 'edit' | 'delete')[],
  /** 
   * Custom bulk actions list. Bulk actions available in list view when user selects multiple records by
   * using checkboxes.
   */
  bulkActions?: Array<AdminForthBulkAction>,

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
  allowedActions?: AllowedActionsInput,

  /**
   * Array of actions which will be displayed in the resource.
   * 
   * Example:
   * 
   * ```ts
   * actions: [
   *  {
   *    name: 'Auto submit',
   *    allowed: ({ adminUser, standardAllowedActions }) => {
   *      return adminUser.dbUser.role === 'superadmin';
   *    },
   *    action: ({ adminUser, resource, recordId, adminforth, extra, tr }) => {
   *      console.log("auto submit", recordId, adminUser);
   *      return { ok: true, successMessage: "Auto submitted" };
   *    },
   *    showIn: {
   *      list: true,
   *      showButton: true,
   *      showThreeDotsMenu: true,
   *    },
   *  },
   * ]
   * ```
   */
  actions?: Array<AdminForthActionInput>,
};

export interface ResourceOptions extends Omit<ResourceOptionsInput, 'allowedActions'> {
  allowedActions: AllowedActions,
  actions?: Array<AdminForthActionInput>,
}

/**
 * Resource describes one table or collection in database.
 * AdminForth generates set of pages for 'list', 'show', 'edit', 'create', 'filter' operations for each resource.
 */
export interface AdminForthResource extends Omit<AdminForthResourceInput, 'options' | 'columns'> {
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
       * Typical use-cases: 
       * - request additional data from database before returning to frontend for soft-join 
       */
      beforeDatasourceRequest?: Array<BeforeDataSourceRequestFunction>,

      /**
       * Typical use-cases:
       * - Transform value for some field for record returned from database before returning to frontend (minimize, sanitize, etc)
       * - If some-why you can't use `backendOnly` you can cleanup sensitive fields here
       * - Attach additional data to record before returning to frontend 
       */
      afterDatasourceResponse?: Array<AfterDataSourceResponseFunction>,
    },
    list?: {
      /**
       * Typical use-cases:
       * - add additional filters in addition to what user selected before fetching data from database.
       * - same as hooks.show.beforeDatasourceRequest 
       */
      beforeDatasourceRequest?: Array<BeforeDataSourceRequestFunction>,

      /**
       * Typical use-cases:
       * - Same as hooks.show.afterDatasourceResponse but applied for all records returned from database for 
       * showing in list view, e.g. add new field to each record in list view
       */
      afterDatasourceResponse?: Array<AfterDataSourceResponseFunction>,
    },
    create?: {
      /**
       * Should return `ok: true` to continue saving pipeline and allow creating record in database, and `ok: false` to interrupt pipeline and prevent record creation.
       * If you need to show error on UI, set `error: \<error message\>` in response.
       * 
       * Typical use-cases:
       * - Create record by custom code (return `{ ok: false, newRecordId: <id of created record from custom code> }`)
       * - Validate record before saving to database and interrupt execution if validation failed (return `{ ok: false, error: <validation error> }`), though `allowedActions.create` should be preferred in most cases
       * - fill-in adminUser as creator of record (set `record.<some field> = x; return \{ ok: true \}`) 
       * - Attach additional data to record before saving to database (mostly fillOnCreate should be used instead)
       */
      beforeSave?: Array<BeforeCreateSaveFunction>,

      /**
       * Typical use-cases:
       * - Initiate some trigger after record saved to database (e.g sync to another datasource)
       */
      afterSave?: Array<AfterCreateSaveFunction>,
    },
    edit?: {
      /**
       * Typical use-cases:
       * - Same as hooks.create.beforeSave but for edit page
       */
      beforeSave?: Array<BeforeEditSaveFunction>,

      /**
       * Typical use-cases:
       * - Same as hooks.create.afterSave but for edit page
       */
      afterSave?: Array<AfterEditSaveFunction>,
    },
    delete?: {
      /**
       * Typical use-cases:
       * - Validate that record can be deleted and interrupt execution if validation failed (`allowedActions.delete` should be preferred in most cases)
       */
      beforeSave?: Array<BeforeDeleteSaveFunction>,
      /**
       * Typical use-cases:
       * - Initiate some trigger after record deleted from database (e.g sync to another datasource)
       */
      afterSave?: Array<BeforeDeleteSaveFunction>,
    },
  },

  options: ResourceOptions,

  columns: Array<AdminForthResourceColumn>,

  dataSourceColumns: Array<AdminForthResourceColumn>,

  recordLabel: (record: any) => string,

  label: string,

  resourceId: string,
}

export interface AdminForthBulkAction extends AdminForthBulkActionCommon {

  /**
   * Callback which will be called on backend when user clicks on action button.
   * It should return Promise which will be resolved when action is done.
   */
  action: ({ resource, selectedIds, adminUser, response, tr }: { 
    resource: AdminForthResource, selectedIds: Array<any>, adminUser: AdminUser, response: IAdminForthHttpResponse, tr: (key: string, category?: string, params?: any) => string
  }) => Promise<{ ok: boolean, error?: string, successMessage?: string }>,

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

export interface AdminForthForeignResource extends AdminForthForeignResourceCommon {
  hooks?: {
    dropdownList?: {
      beforeDatasourceRequest?: BeforeDataSourceRequestFunction | Array<BeforeDataSourceRequestFunction>,
      afterDatasourceResponse?: AfterDataSourceResponseFunction | Array<AfterDataSourceResponseFunction>,
    },
  },
  onDelete: 'cascade' | 'setNull'
}

export type ShowInModernInput = {
  [key in AdminForthResourcePages]?: AllowedActionValue
} & {
  all?: AllowedActionValue;
}

export type ShowInLegacyInput = Array<AdminForthResourcePages | keyof typeof AdminForthResourcePages>;

/**
 * Object which describes on what pages should column be displayed on.
 */
export type ShowInInput = ShowInModernInput | ShowInLegacyInput;

export type ShowIn = {
  [key in AdminForthResourcePages]: AllowedActionValue
}
export type BackendOnlyInput =
  | boolean
  | ((p: {
      adminUser: AdminUser;
      resource: AdminForthResource;
      meta: any;
      source: ActionCheckSource;
      adminforth: IAdminForth;
    }) => boolean | Promise<boolean>);


export interface AdminForthResourceColumnInput extends Omit<AdminForthResourceColumnInputCommon, 'showIn' | 'backendOnly'> {
  showIn?: ShowInInput,
  foreignResource?: AdminForthForeignResource,
  backendOnly?: BackendOnlyInput;
}

export interface AdminForthResourceColumn extends Omit<AdminForthResourceColumnCommon, 'showIn' | 'backendOnly'> {
  showIn?: ShowIn,
  foreignResource?: AdminForthForeignResource,
  backendOnly?: BackendOnlyInput;
}

export interface IWebSocketClient {
  id: string;
  lastPing: number;
  topics: Set<string>;
  adminUser: AdminUser;
  
  send: (message: string) => void;
  close: () => void;
  onMessage: (handler: (message: string) => void) => void;
  onClose: (handler: () => void) => void;
}

export interface IWebSocketBroker {
  publish: (topic: string, data: any, filterUsers?: (adminUser: AdminUser) => Promise<boolean>) => void;

  registerWsClient: (client: IWebSocketClient) => void;
}