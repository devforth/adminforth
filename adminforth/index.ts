import AdminForthAuth from './auth.js';
import MongoConnector from './dataConnectors/mongo.js';
import PostgresConnector from './dataConnectors/postgres.js';
import MysqlConnector from './dataConnectors/mysql.js';
import SQLiteConnector from './dataConnectors/sqlite.js';
import CodeInjector from './modules/codeInjector.js';
import ExpressServer from './servers/express.js';
// import FastifyServer from './servers/fastify.js';
import { ADMINFORTH_VERSION, listify, suggestIfTypo, RateLimiter, getClientIp } from './modules/utils.js';

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
  HttpExtra,
  BeforeCreateSaveFunction,
  AdminForthInputConfig,
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

// exports
export * from './types/Back.js';
export * from './types/Common.js';
export * from './types/Adapters.js';
export { interpretResource };
export { AdminForthPlugin };
export { suggestIfTypo, RateLimiter, getClientIp };


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
    this.codeInjector = new CodeInjector(this);
    this.configValidator = new ConfigValidator(this, config);
    this.restApi = new AdminForthRestAPI(this);
    this.websocket = new SocketBroker(this);
    this.activatedPlugins = [];
    
    this.configValidator.validateConfig();
    this.activatePlugins();

    this.express = new ExpressServer(this);
    // this.fastify = new FastifyServer(this);
    this.auth = new AdminForthAuth(this);
    this.connectors = {};
    this.statuses = {
      dbDiscover: 'running',
    };

   

    console.log(`${this.formatAdminForth()} v${ADMINFORTH_VERSION} starting up`)
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
    process.env.HEAVY_DEBUG && console.log('🔌🔌🔌 Activating plugins');
    const allPluginInstances = [];
    for (let resource of this.config.resources) {
      for (let pluginInstance of resource.plugins || []) {
        allPluginInstances.push({pi: pluginInstance, resource});
      }
    }
    allPluginInstances.sort(({pi: a}, {pi: b}) => a.activationOrder - b.activationOrder);
    allPluginInstances.forEach(
      ({pi: pluginInstance, resource}) => {
        pluginInstance.modifyResourceConfig(this, resource);
        const plugin = this.activatedPlugins.find((p) => p.pluginInstanceId === pluginInstance.pluginInstanceId);
        if (plugin) {
          process.env.HEAVY_DEBUG && console.log(`Current plugin pluginInstance.pluginInstanceId ${pluginInstance.pluginInstanceId}`);
          
          throw new Error(`Attempt to activate Plugin ${pluginInstance.constructor.name} second time for same resource, but plugin does not support it. 
            To support multiple plugin instance pre one resource, plugin should return unique string values for each installation from instanceUniqueRepresentation`);
        }
        this.activatedPlugins.push(pluginInstance);
      }
    );
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

  validateRecordValues(resource: AdminForthResource, record: any): any {
    // check if record with validation is valid
    for (const column of resource.columns.filter((col) => col.name in record && col.validation)) {
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
        if (column.minValue !== undefined && record[column.name] < column.minValue) {
          return `Value in "${column.name}" must be greater than ${column.minValue}`;
        }
        if (column.maxValue !== undefined && record[column.name] > column.maxValue) {
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
        console.error(`Error while connecting to datasource '${dataSourceId}':`, e);
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
        console.error(`Error discovering fields for resource '${res.table}' (In resource '${res.resourceId}')`, e);
      }
      if (fieldTypes !== null && !Object.keys(fieldTypes).length) {
        throw new Error(`Table '${res.table}' (In resource '${res.resourceId}') has no fields or does not exist`);
      }
      if (fieldTypes === null) {
        console.error(`⛔ DataSource ${res.dataSource} was not able to perform field discovery. It will not work properly`);
        return;
      }
      if (!res.columns) {
        res.columns = Object.keys(fieldTypes).map((name) => ({ name }));
      }

      res.columns.forEach((col, i) => {
        if (!fieldTypes[col.name] && !col.virtual) {
          const similar = suggestIfTypo(Object.keys(fieldTypes), col.name);
          throw new Error(`Resource '${res.table}' has no column '${col.name}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
        }
        // first find discovered values, but allow override
        res.columns[i] = { ...fieldTypes[col.name], ...col };
      });
      
      this.validateFieldGroups(res.options.fieldGroups, fieldTypes);
      this.validateFieldGroups(res.options.showFieldGroups, fieldTypes);
      this.validateFieldGroups(res.options.createFieldGroups, fieldTypes);
      this.validateFieldGroups(res.options.editFieldGroups, fieldTypes);


      // check if primaryKey column is present
      if (!res.columns.some((col) => col.primaryKey)) {
        throw new Error(`Resource '${res.table}' has no column defined or auto-discovered. Please set 'primaryKey: true' in a columns which has unique value for each record and index`);
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

    // console.log('⚙️⚙️⚙️ Database discovery done', JSON.stringify(this.config.resources, null, 2));
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
      filters: [
        { field: resource.columns.find((col) => col.primaryKey).name, operator: AdminForthFilterOperators.EQ, value: pk },
      ],
      limit: 1,
      offset: 0,
      sort: [],
    });
    return users.data[0] || null;
  }

  async createResourceRecord(
    { resource, record, adminUser, extra }: 
    { resource: AdminForthResource, record: any, adminUser: AdminUser, extra?: HttpExtra }
  ): Promise<{ error?: string, createdRecord?: any }> {

    const err = this.validateRecordValues(resource, record);
    if (err) {
      return { error: err };
    }

    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.beforeSave)) {
      console.log('🪲 Hook beforeSave', hook);
      const resp = await hook({ 
        resource, 
        record, 
        adminUser,
        adminforth: this,
        extra,
      });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
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
    process.env.HEAVY_DEBUG && console.log('🪲🆕 creating record createResourceRecord', record);
    const { error, createdRecord } = await connector.createRecord({ resource, record, adminUser });
    if ( error ) {
      return { error };
    }
    
    const primaryKey = record[resource.columns.find((col) => col.primaryKey).name];

    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.afterSave)) {
      process.env.HEAVY_DEBUG && console.log('🪲 Hook afterSave', hook);
      const resp = await hook({ 
        recordId: primaryKey, 
        resource, 
        record: createdRecord, 
        adminUser,
        adminforth: this,
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
   */
  async updateResourceRecord(
    { resource, recordId, record, oldRecord, adminUser, extra }:
    { resource: AdminForthResource, recordId: any, record: any, oldRecord: any, adminUser: AdminUser, extra?: HttpExtra }
  ): Promise<{ error?: string }> {

    const err = this.validateRecordValues(resource, record);
    if (err) {
      return { error: err };
    }

    // remove editReadonly columns from record
    for (const column of resource.columns.filter((col) => col.editReadonly)) {
      if (column.name in record)
        delete record[column.name];
    }

    // execute hook if needed
    for (const hook of listify(resource.hooks?.edit?.beforeSave)) {
      const resp = await hook({
        recordId,
        resource,
        record,
        updates: record,
        oldRecord,
        adminUser,
        adminforth: this,
        extra,
      });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
      }
      if (resp.error) {
        return { error: resp.error };
      }
    }

    const newValues = {};
    const connector = this.connectors[resource.dataSource];

    for (const recordField in record) {
      if (record[recordField] !== oldRecord[recordField]) {
        // leave only changed fields to reduce data transfer/modifications in db
        const column = resource.columns.find((col) => col.name === recordField);
        if (!column || !column.virtual) {
          // exclude virtual columns
          newValues[recordField] = record[recordField];
        }
      }
    } 

    if (Object.keys(newValues).length > 0) {
      await connector.updateRecord({ resource, recordId, newValues });
    }
    
    // execute hook if needed
    for (const hook of listify(resource.hooks?.edit?.afterSave)) {
      const resp = await hook({ 
        resource, 
        record,
        updates: record,
        adminUser, 
        oldRecord,
        recordId,
        adminforth: this,
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

  async deleteResourceRecord(
    { resource, recordId, adminUser, record, extra }:
    { resource: AdminForthResource, recordId: any, adminUser: AdminUser, record: any, extra?: HttpExtra }
  ): Promise<{ error?: string }> {
    // execute hook if needed
    for (const hook of listify(resource.hooks?.delete?.beforeSave)) {
      const resp = await hook({ 
        resource, 
        record, 
        adminUser,
        recordId,
        adminforth: this,
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