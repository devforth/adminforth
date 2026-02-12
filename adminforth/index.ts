import AdminForthAuth from './auth.js';
import MongoConnector from './dataConnectors/mongo.js';
import PostgresConnector from './dataConnectors/postgres.js';
import MysqlConnector from './dataConnectors/mysql.js';
import SQLiteConnector from './dataConnectors/sqlite.js';
import CodeInjector from './modules/codeInjector.js';
import ExpressServer from './servers/express.js';
// import FastifyServer from './servers/fastify.js';
import { ADMINFORTH_VERSION, listify, suggestIfTypo, RateLimiter, RAMLock, getClientIp, isProbablyUUIDColumn } from './modules/utils.js';
import { 
  type AdminForthConfig, 
  type IAdminForth, 
  type IConfigValidator,
  type AdminForthResourceColumn,
  IOperationalResource,
  IHttpServer, 
  AdminForthResource,
  IAdminForthDataSourceConnectorBase,
  IWebSocketBroker,
  AdminForthInputConfig,
  CreateResourceRecordParams,
  UpdateResourceRecordParams,
  DeleteResourceRecordParams,
  CreateResourceRecordResult,
  UpdateResourceRecordResult,
  DeleteResourceRecordResult,
} from './types/Back.js';
import {
  AdminForthFilterOperators,
  AdminForthDataTypes,
  AdminUser,
} from './types/Common.js';

import AdminForthPlugin from './basePlugin.js';
import ConfigValidator from './modules/configValidator.js';
import AdminForthRestAPI, { interpretResource } from './modules/restApi.js';
import ClickhouseConnector from './dataConnectors/clickhouse.js';
import OperationalResource from './modules/operationalResource.js';
import SocketBroker from './modules/socketBroker.js';
import { afLogger } from './modules/logger.js';
export { afLogger } from './modules/logger.js';
export { logger } from './modules/logger.js';

// exports
export * from './types/Back.js';
export * from './types/Common.js';
export * from './types/adapters/index.js';
export { interpretResource };
export { AdminForthPlugin };
export { suggestIfTypo, RateLimiter, RAMLock, getClientIp };


class AdminForth implements IAdminForth {
  static Types = AdminForthDataTypes;

  static Utils = {
    generatePasswordHash: async (password) => {
      return await AdminForthAuth.generatePasswordHash(password);
    },

    applyRegexValidation(value, validation) {
      if (validation?.length) {
        const validationArray = validation;
        for (let i = 0; i < validationArray.length; i++) {
          if (validationArray[i].regExp) {
            let flags = '';
            if (validationArray[i].caseSensitive) {
              flags += 'i';
            }
            if (validationArray[i].multiline) {
              flags += 'm';
            }
            if (validationArray[i].global) {
              flags += 'g';
            }

            const regExp = new RegExp(validationArray[i].regExp, flags);
            if (value === undefined || value === null) {
              value = '';
            }
            let valueS = `${value}`;

            if (!regExp.test(valueS)) {
              return validationArray[i].message;
            }
          }
        }
      }
    },

    PASSWORD_VALIDATORS: {
      UP_LOW_NUM_SPECIAL: {
        regExp: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*\\(\\)\\-_=\\+\\[\\]\\{\\}\\|;:\',\\.<>\\/\\?]).+$',
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
      },
      UP_LOW_NUM: {
        regExp: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).+$',
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
      },
    },
    EMAIL_VALIDATOR: {
      regExp: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
      message: 'Email is not valid, must be in format example@test.com',
    }

  }

  config: AdminForthConfig;
  express: ExpressServer;
  // fastify: FastifyServer;
  auth: AdminForthAuth;
  codeInjector: CodeInjector;
  connectors: {
    [dataSourceId: string]: IAdminForthDataSourceConnectorBase,
  };
  connectorClasses: any;
  runningHotReload: boolean;
  activatedPlugins: Array<AdminForthPlugin>;
  pluginsById: Record<string, AdminForthPlugin> = {};
  configValidator: IConfigValidator;
  restApi: AdminForthRestAPI;

  websocket: IWebSocketBroker;

  operationalResources: {
    [resourceId: string]: IOperationalResource,
  }

  statuses: {
    dbDiscover: 'running' | 'done',
  }

  constructor(config: AdminForthInputConfig) {
    afLogger.trace('🔧 AdminForth constructor started');
    
    if (global.adminforth) {
      throw new Error('AdminForth instance already created in this process. '+
        'If you want to use multiple instances, consider using different process for each instance');
    }
    
    afLogger.trace('🔧 Creating CodeInjector...');
    this.codeInjector = new CodeInjector(this);
    afLogger.trace('🔧 CodeInjector created');
    
    afLogger.trace('🔧 Creating ConfigValidator...');
    this.configValidator = new ConfigValidator(this, config);
    afLogger.trace('🔧 ConfigValidator created');
    
    afLogger.trace('🔧 Creating AdminForthRestAPI...');
    this.restApi = new AdminForthRestAPI(this);
    afLogger.trace('🔧 AdminForthRestAPI created');
    
    afLogger.trace('🔧 Creating SocketBroker...');
    this.websocket = new SocketBroker(this);
    afLogger.trace('🔧 SocketBroker created');
    
    this.activatedPlugins = [];
    
    afLogger.trace('🔧 Validating config...');
    this.configValidator.validateConfig();
    afLogger.trace('🔧 Config validated');
    
    afLogger.trace('🔧 Activating plugins...');
    this.activatePlugins();
    afLogger.trace('🔧 Plugins activated');

    afLogger.trace('🔧 Validating after plugin activation...');
    this.configValidator.validateAfterPluginsActivation();
    afLogger.trace('🔧 Config validated');

    afLogger.trace('🔧 Creating ExpressServer...');
    this.express = new ExpressServer(this);
    afLogger.trace('🔧 ExpressServer created');
    
    // this.fastify = new FastifyServer(this);
    afLogger.trace('🔧 Creating AdminForthAuth...');
    this.auth = new AdminForthAuth(this);
    afLogger.trace('🔧 AdminForthAuth created');
    
    this.connectors = {};
    this.statuses = {
      dbDiscover: 'running',
    };

    afLogger.info(`${this.formatAdminForth()} v${ADMINFORTH_VERSION} initializing...`);
    afLogger.trace('🔧 About to set global.adminforth...');
    global.adminforth = this;
    afLogger.trace('🔧 global.adminforth set successfully');
    afLogger.trace('🔧 AdminForth constructor completed');
  }

  formatAdminForth() {
    const NO_FORMAT='\x1b[0m'
    const F_BOLD="\x1b[1m"
    const C_AQUA="\x1b[38;5;14m"
    const C_GREY70="\x1b[38;5;249m"
    const C_GREY15="\x1b[48;5;235m"
    return `${F_BOLD}${C_GREY70}${C_GREY15} 🚀 Admin${C_AQUA}Forth ${NO_FORMAT}`
  }

  async tr(this, msg: string, category: string = 'default', lang: string = 'en', params: any): Promise<string> {
    // stub function to make a translation
    if (params) {
      for (const key in params) {
        msg = msg.replace(new RegExp(`{${key}}`, 'g'), params[key]);
      }
    }
    return msg;
  }

  activatePlugins() {
    afLogger.trace('🔌🔌🔌 Activating plugins');
    const allPluginInstances = [];
    for (let resource of this.config.resources) {
      afLogger.trace(`🔌 Checking plugins for resource: ${resource.resourceId}`);
      for (let pluginInstance of resource.plugins || []) {
        afLogger.trace(`🔌 Found plugin: ${pluginInstance.constructor.name} for resource ${resource.resourceId}`);
        allPluginInstances.push({pi: pluginInstance, resource});
      }
    }
    afLogger.trace(`🔌 Total plugins to activate: ${allPluginInstances.length}`);
    
    let activationLoopCounter = 0;
    while (true) {
      activationLoopCounter++;
      if (activationLoopCounter > 10) {
        throw new Error('Plugin activation loop exceeded 10 iterations, possible infinite loop (some plugin tries to activate himself in a loop)');
      }
      afLogger.trace(`🔌 Plugin activation loop iteration: ${activationLoopCounter}`);
      afLogger.trace(`🔌 Activated plugins count: ${this.activatedPlugins.length}/${allPluginInstances.length}`);
      const allPluginsAreActivated = allPluginInstances.length === this.activatedPlugins.length;
      if (allPluginsAreActivated) {
        break;
      }
    
      const unactivatedPlugins = allPluginInstances.filter(({pi: pluginInstance}) => 
        !this.activatedPlugins.find((p) => p.pluginInstanceId === pluginInstance.pluginInstanceId)
      );

      afLogger.trace(`🔌 Unactivated plugins remaining: ${unactivatedPlugins.length}`);
      
      afLogger.trace(`🔌 Unactivated plugins count: ${unactivatedPlugins.length}`);

      unactivatedPlugins.sort(({pi: a}, {pi: b}) => a.activationOrder - b.activationOrder);
      afLogger.trace(`🔌 Activating plugins in order: ${unactivatedPlugins.map(({pi}) => pi.constructor.name)}`);
      unactivatedPlugins.forEach(
        ({pi: pluginInstance, resource}, index) => {
          afLogger.trace(`Activating plugin: ${pluginInstance.constructor.name}`);
          afLogger.trace(`🔌 Activating plugin ${index + 1}/${unactivatedPlugins.length}: ${pluginInstance.constructor.name} for resource ${resource.resourceId}`);
          pluginInstance.modifyResourceConfig(this, resource, allPluginInstances);
          afLogger.trace(`🔌 Plugin ${pluginInstance.constructor.name} modifyResourceConfig completed`);
          
          const plugin = this.activatedPlugins.find((p) => p.pluginInstanceId === pluginInstance.pluginInstanceId);
          if (plugin) {
            afLogger.trace(`Current plugin pluginInstance.pluginInstanceId ${pluginInstance.pluginInstanceId}`);
            
            throw new Error(`Attempt to activate Plugin ${pluginInstance.constructor.name} second time for same resource, but plugin does not support it. 
              To support multiple plugin instance pre one resource, plugin should return unique string values for each installation from instanceUniqueRepresentation`);
          }
          const pluginId = pluginInstance.pluginOptions?.id;
          if (pluginId) {
            if (this.pluginsById[pluginId]) {
              throw new Error(`Plugin with id "${pluginId}" already exists!`);
            }
            this.pluginsById[pluginId] = pluginInstance;
          }
          this.activatedPlugins.push(pluginInstance);
          afLogger.trace(`🔌 Plugin ${pluginInstance.constructor.name} activated successfully`);
        }
      );
      afLogger.trace(`🔌activated plugins: ${this.activatedPlugins.map((pi) => pi.constructor.name)}`);
    }
    afLogger.trace('🔌 All plugins activation completed');
  }

  getPluginsByClassName<T>(className: string): T[] {
    const plugins = this.activatedPlugins.filter((plugin) => plugin.className === className);
    return plugins as T[];
  }

  getPluginByClassName<T>(className: string): T {
    const plugins = this.getPluginsByClassName(className);
    if (plugins.length > 1) {
      throw new Error(`Multiple plugins with className ${className} found. Use getPluginsByClassName instead`);
    }
    if (plugins.length === 0) {
      const similar = suggestIfTypo(this.activatedPlugins.map((p) => p.className), className);
      throw new Error(`Plugin with className ${className} not found. ${similar ? `Did you mean ${similar}?` : ''}`);
    }
    return plugins[0] as T;
  }

  getPluginById<T = any>(id: string): T {
    const plugin = this.pluginsById[id];
    if (!plugin) {
      const similar = suggestIfTypo(Object.keys(this.pluginsById), id);
      throw new Error(`Plugin with id "${id}" not found.${similar ? ` Did you mean "${similar}"?` : ''}`);
      }
      return plugin as T;
    }

  validateFieldGroups(fieldGroups: {
    groupName: string;
    columns: string[];
    noTitle?: boolean;
  }[], fieldTypes: {
    [key: string]: AdminForthResourceColumn;
}): void {
    if (!fieldGroups) return;
    const allColumns = Object.keys(fieldTypes);
  
    fieldGroups.forEach((group) => {
      group.noTitle = group.noTitle ?? false;
      group.columns.forEach((col) => {
        if (!allColumns.includes(col)) {
          const similar = suggestIfTypo(allColumns, col);
          throw new Error(
            `Group '${group.groupName}' has an unknown column '${col}'. ${
              similar ? `Did you mean '${similar}'?` : ''
            }`
          );
        }
      });
    });
  }

  validateRecordValues(resource: AdminForthResource, record: any,  mode: 'create' | 'edit'): any {
    // check if record with validation is valid
    for (const column of resource.columns.filter((col) => col.name in record && col.validation)) {
      const required = typeof column.required === 'object'
      ? column.required[mode]
      : true;

      if (!required && !record[column.name]) continue;

      let error = null;
      if (column.isArray?.enabled) {
        error = record[column.name].reduce((err, item) => {
          return err || AdminForth.Utils.applyRegexValidation(item, column.validation);
        }, null);
      } else {
        error = AdminForth.Utils.applyRegexValidation(record[column.name], column.validation);
      }
      if (error) {
        return error;
      }
    }

    // check if record with minValue or maxValue is within limits
    for (const column of resource.columns.filter((col) => col.name in record
      && ['integer', 'decimal', 'float'].includes(col.isArray?.enabled ? col.isArray.itemType : col.type)
      && (col.minValue !== undefined || col.maxValue !== undefined))) {
      if (column.isArray?.enabled) {
        const error = record[column.name].reduce((err, item) => {
          if (err) return err;

          if (column.minValue !== undefined && item < column.minValue) {
            return `Value in "${column.name}" must be greater than ${column.minValue}`;
          }
          if (column.maxValue !== undefined && item > column.maxValue) {
            return `Value in "${column.name}" must be less than ${column.maxValue}`;
          }

          return null;
        }, null);
        if (error) {
          return error;
        }
      } else {
        if (column.minValue !== undefined && record[column.name] && record[column.name] < column.minValue) {
          return `Value in "${column.name}" must be greater than ${column.minValue}`;
        }
        if (column.maxValue !== undefined && record[column.name] && record[column.name] > column.maxValue) {
          return `Value in "${column.name}" must be less than ${column.maxValue}`;
        }
      }
    }

    return null;
  }


  async discoverDatabases() {
    this.statuses.dbDiscover = 'running';
    this.connectorClasses = {
      'sqlite': SQLiteConnector,
      'postgres': PostgresConnector,
      'postgresql': PostgresConnector,
      'mongodb': MongoConnector,
      'clickhouse': ClickhouseConnector,
      'mysql': MysqlConnector,
    };
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = {...this.connectorClasses};
    }
    this.config.dataSources.forEach((ds) => {
      const dbType = ds.url.split(':')[0];
      if (!this.config.databaseConnectors[dbType]) {
        throw new Error(`Database type '${dbType}' is not supported, consider using one of ${Object.keys(this.connectorClasses).join(', ')} or create your own data-source connector`);
      }
      this.connectors[ds.id] = new this.config.databaseConnectors[dbType]();  
    });

    await Promise.all(Object.keys(this.connectors).map(async (dataSourceId) => {
      try {
        await this.connectors[dataSourceId].setupClient(this.config.dataSources.find((ds) => ds.id === dataSourceId).url);
      } catch (e) {
        afLogger.error(`Error while connecting to datasource '${dataSourceId}': ${e}`);
      }
    }));

    await Promise.all(this.config.resources.map(async (res) => {
      if (!this.connectors[res.dataSource]) {
        const similar = suggestIfTypo(Object.keys(this.connectors), res.dataSource);
        throw new Error(`Resource '${res.table}' refers to unknown dataSource '${res.dataSource}' ${similar 
          ? `. Did you mean '${similar}'?` : 'Available dataSources: '+Object.keys(this.connectors).join(', ')}`
        );
      }
      let fieldTypes = null;
      try {
        fieldTypes = await this.connectors[res.dataSource].discoverFields(res);
      } catch (e) {
        afLogger.error(`Error discovering fields for resource '${res.table}' (In resource '${res.resourceId}') ${e}`);
      }
      if (fieldTypes !== null && !Object.keys(fieldTypes).length) {
        throw new Error(`Table '${res.table}' (In resource '${res.resourceId}') has no fields or does not exist`);
      }
      if (fieldTypes === null) {
        afLogger.error(`⛔ DataSource ${res.dataSource} was not able to perform field discovery. It will not work properly`);
        if (process.env.NODE_ENV === 'production') {
          process.exit(1); 
        }
        return;
      }
      if (!res.columns) {
        res.columns = Object.keys(fieldTypes).map((name) => ({ name }));
      }

      res.columns.forEach((col, i) => {
        if (!fieldTypes[col.name] && !col.virtual) {
          const similar = suggestIfTypo(Object.keys(fieldTypes), col.name);
          throw new Error(`Table '${res.table}' has no column '${col.name}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
        }
        // first find discovered values, but allow override
        res.columns[i] = { ...fieldTypes[col.name], ...col };
      });

      // check if primaryKey column is present
      if (!res.columns.some((col) => col.primaryKey)) {
        throw new Error(`Table '${res.table}' has no column defined or auto-discovered. Please set 'primaryKey: true' in a columns which has unique value for each record and index`);
      }

    }));

    this.statuses.dbDiscover = 'done';

    for (const res of this.config.resources) {
      this.configValidator.postProcessAfterDiscover(res);
    } 

    this.operationalResources = {};
    this.config.resources.forEach((resource) => {
      this.operationalResources[resource.resourceId] = new OperationalResource(this.connectors[resource.dataSource], resource);
    });

  }

  async getAllTables(): Promise<{ [dataSourceId: string]: string[] }> {
    const results: { [dataSourceId: string]: string[] } = {};
  
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = {...this.connectorClasses};
    }
    
    await Promise.all(
      Object.entries(this.connectors).map(async ([dataSourceId, connector]) => {
        if (typeof connector.getAllTables === 'function') {
          try {
            const tables = await connector.getAllTables();
            results[dataSourceId] = tables;
          } catch (err) {
            afLogger.error(`Error getting tables for dataSource ${dataSourceId}: ${err}`);
            results[dataSourceId] = [];
          }
        } else {
          results[dataSourceId] = [];
        }
      })
    );
  
    return results;
  }

  async getAllColumnsInTable(
    tableName: string
  ): Promise<{ [dataSourceId: string]: Array<{ name: string; type?: string; isPrimaryKey?: boolean; isUUID?: boolean; }> }> {
    const results: { [dataSourceId: string]: Array<{ name: string; type?: string; isPrimaryKey?: boolean;  isUUID?: boolean; }> } = {};
  
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = { ...this.connectorClasses };
    }
  
    await Promise.all(
      Object.entries(this.connectors).map(async ([dataSourceId, connector]) => {
        if (typeof connector.getAllColumnsInTable === 'function') {
          try {
            const columns = await connector.getAllColumnsInTable(tableName);
            results[dataSourceId] = columns.map(column => ({
              ...column,
              isUUID: isProbablyUUIDColumn(column),
            }));
          } catch (err) {
            afLogger.error(`Error getting columns for table ${tableName} in dataSource ${dataSourceId}: ${err}`);
            results[dataSourceId] = [];
          }
        } else {
          results[dataSourceId] = [];
        }
      })
    );
  
    return results;
  }
  

  async bundleNow({ hotReload=false }) {
    await this.codeInjector.bundleNow({ hotReload });
  }

  async getUserByPk(pk: string) {
    // if database discovery is not done, throw
    if (this.statuses.dbDiscover !== 'done') {
      if (this.statuses.dbDiscover === 'running') {
        throw new Error('Database discovery is running. You can\'t use data API while database discovery is not finished.\n'+
          'Consider moving your code to a place where it will be executed after database discovery is already done (after await admin.discoverDatabases())');
      }
      throw new Error('Database discovery is not yet started. You can\'t use data API before database discovery is done. \n'+
        'Call admin.discoverDatabases() first and await it before using data API');
    }

    const resource = this.config.resources.find((res) => res.resourceId === this.config.auth.usersResourceId);
    if (!resource) {
      const similar = suggestIfTypo(this.config.resources.map((res) => res.resourceId), this.config.auth.usersResourceId);
      throw new Error(`No resource with  ${this.config.auth.usersResourceId} found. ${similar ? 
        `Did you mean '${similar}' in config.auth.usersResourceId?` : 'Please set correct resource in config.auth.usersResourceId'}`
      );
    }
    const users = await this.connectors[resource.dataSource].getData({
      resource,
      filters: { operator: AdminForthFilterOperators.AND, subFilters: [
        { field: resource.columns.find((col) => col.primaryKey).name, operator: AdminForthFilterOperators.EQ, value: pk },
      ]},
      limit: 1,
      offset: 0,
      sort: [],
    });
    return users.data[0] || null;
  }

  /**
   * Create record and execute hooks
   * @param params - Parameters for record creation. See CreateResourceRecordParams.
   * @returns Result of record creation. See CreateResourceRecordResult.
   */
  async createResourceRecord(
    params: CreateResourceRecordParams,
  ): Promise<CreateResourceRecordResult> {
    const { resource, record, adminUser, extra, response } = params;

    const err = this.validateRecordValues(resource, record, 'create');
    if (err) {
      return { error: err };
    }

    const recordWithVirtualColumns = { ...record };

    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.beforeSave)) {
      afLogger.debug(`🪲 Hook beforeSave ${hook}`);
      const resp = await hook({ 
        resource, 
        record, 
        adminUser,
        adminforth: this,
        response, 
        extra,
      });
      if (resp.newRecordId) {
        afLogger.warn(`Deprecation warning: beforeSave hook returned 'newRecordId'. Since AdminForth v1.2.9 use 'redirectToRecordId' instead. 'newRecordId' will be removed in v2.0.0`);
      }
      if (!resp || (typeof resp.ok !== 'boolean' && (!resp.error && !resp.newRecordId && !resp.redirectToRecordId))) {
        throw new Error(
          `Invalid return value from beforeSave hook. Expected: { ok: boolean, error?: string | null, newRecordId?: any, redirectToRecordId?: any }.\n` +
          `Note: Return { ok: false, error: null, redirectToRecordId } (preferred) or { ok: false, error: null, newRecordId } (deprecated) to stop creation and redirect to an existing record.`
        );
      }
      if (resp.ok === false && !resp.error) {
        const { error, ok, newRecordId, redirectToRecordId } = resp;
        return {
          error: error ?? 'Operation aborted by hook',
          newRecordId: redirectToRecordId ? redirectToRecordId : newRecordId,
          redirectToRecordId: redirectToRecordId
        };
      }
      if (resp.error) {
        return { error: resp.error };
      }
    }

    // remove virtual columns from record
    for (const column of resource.columns.filter((col) => col.virtual)) {
      if (record[column.name]) {
        delete record[column.name];
      }
    }
    const connector = this.connectors[resource.dataSource];
    afLogger.trace(`🪲🆕 creating record createResourceRecord, record: ${JSON.stringify(record)}`);
    const { error, createdRecord } = await connector.createRecord({ resource, record, adminUser });
    if ( error ) {
      return { error };
    }
    
    const primaryKey = createdRecord[resource.columns.find((col) => col.primaryKey).name];

    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.afterSave)) {
      afLogger.trace(`🪲 Hook afterSave ${hook}`);
      const resp = await hook({ 
        recordId: primaryKey, 
        resource, 
        record: createdRecord, 
        adminUser,
        adminforth: this,
        recordWithVirtualColumns,
        response,
        extra,
      });

      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
      }

      if (resp.error) {
        return { error: resp.error };
      }
    }

    return { error, createdRecord };
  }

  /**
   * record is partial record with only changed fields
   * 
   * Update record by id and execute hooks
    * @param params - Parameters for record update. See UpdateResourceRecordParams.
    * @returns Result of record update. See UpdateResourceRecordResult.
   */
  async updateResourceRecord(
    params: UpdateResourceRecordParams,
  ): Promise<UpdateResourceRecordResult> {
    const { resource, recordId, record, oldRecord, adminUser, response, extra, updates } = params;
    const dataToUse = updates || record;
    const err = this.validateRecordValues(resource, dataToUse, 'edit');
    if (err) {
      return { error: err };
    }

    if (record) {
      afLogger.warn(`updateResourceRecord function received 'record' param which is deprecated and will be removed in future version, please use 'updates' instead.`);
    }

    // remove editReadonly columns from record
    for (const column of resource.columns.filter((col) => col.editReadonly)) {
      if (column.name in dataToUse)
        delete dataToUse[column.name];
    }

    // execute hook if needed
    for (const hook of listify(resource.hooks?.edit?.beforeSave)) {
      const resp = await hook({
        recordId,
        resource,
        record: dataToUse,
        updates: dataToUse,
        oldRecord,
        adminUser,
        adminforth: this,
        response,
        extra,
      });
      if (!resp || typeof resp.ok !== 'boolean') {
        throw new Error(`Hook beforeSave must return { ok: boolean, error?: string | null }`);
      }
      if (resp.ok === false && !resp.error) {
        return { error: resp.error ?? 'Operation aborted by hook' };
      }
      if (resp.error) {
        return { error: resp.error };
      }
    }

    const newValues = {};
    const connector = this.connectors[resource.dataSource];

    for (const recordField in dataToUse) {
      if (dataToUse[recordField] !== oldRecord[recordField]) {
        // leave only changed fields to reduce data transfer/modifications in db
        const column = resource.columns.find((col) => col.name === recordField);
        if (!column || !column.virtual) {
          // exclude virtual columns
          newValues[recordField] = dataToUse[recordField];
        }
      }
    } 

    if (Object.keys(newValues).length > 0) {
      const { error } = await connector.updateRecord({ resource, recordId, newValues });
      if ( error ) {
        return { error };
      }
    }
    
    // execute hook if needed
    for (const hook of listify(resource.hooks?.edit?.afterSave)) {
      const resp = await hook({ 
        resource, 
        record: dataToUse,
        updates: dataToUse,
        adminUser, 
        oldRecord,
        recordId,
        adminforth: this,
        response,
        extra,
      });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
      }
      if (resp.error) {
        return { error: resp.error };
      }
    }
    
    return { error: null };
  }

  /**
   * Delete record by id and execute hooks
   * @param params - Parameters for record deletion. See DeleteResourceRecordParams.
   * @returns Result of record deletion. See DeleteResourceRecordResult.
   */
  async deleteResourceRecord(
    params: DeleteResourceRecordParams,
  ): Promise<DeleteResourceRecordResult> {
    const { resource, recordId, adminUser, record, response, extra } = params;
    // execute hook if needed
    for (const hook of listify(resource.hooks?.delete?.beforeSave)) {
      const resp = await hook({ 
        resource, 
        record, 
        adminUser,
        recordId,
        adminforth: this,
        response,
        extra,
      });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
      }

      if (resp.error) {
        return { error: resp.error };
      }
    }

    const connector = this.connectors[resource.dataSource];
    await connector.deleteRecord({ resource, recordId});

    // execute hook if needed
    for (const hook of listify(resource.hooks?.delete?.afterSave)) {
      const resp = await hook({ 
        resource, 
        record, 
        adminUser,
        recordId,
        adminforth: this,
        response,
        extra,
      });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
      }

      if (resp.error) {
        return { error: resp.error };
      }
    }

    return { error: null };
  }

  resource(resourceId: string): IOperationalResource {
    if (this.statuses.dbDiscover !== 'done') {
      if (this.statuses.dbDiscover === 'running') {
        throw new Error('Database discovery is running. You can\'t use data API while database discovery is not finished.\n'+
          'Consider moving your code to a place where it will be executed after database discovery is already done (after await admin.discoverDatabases())');
      } else {
        throw new Error('Database discovery is not yet started. You can\'t use data API before database discovery is done. \n'+
          'Call admin.discoverDatabases() first and await it before using data API');
      }
    }
    if (!this.operationalResources[resourceId]) {
      const closeName = suggestIfTypo(Object.keys(this.operationalResources), resourceId);
      throw new Error(`Resource with id '${resourceId}' not found${closeName ? `. Did you mean '${closeName}'?` : ''}`);
    }
    return this.operationalResources[resourceId];
  }

  setupEndpoints(server: IHttpServer) {
    this.restApi.registerEndpoints(server);
  }

}

export default AdminForth;