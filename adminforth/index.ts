
import AdminForthAuth from './auth.js';
import MongoConnector from './dataConnectors/mongo.js';
import PostgresConnector from './dataConnectors/postgres.js';
import SQLiteConnector from './dataConnectors/sqlite.js';
import CodeInjector from './modules/codeInjector.js';
import ExpressServer from './servers/express.js';
import { ADMINFORTH_VERSION, listify } from './modules/utils.js';
import { 
  type AdminForthConfig, 
  type IAdminForth, 
  type IConfigValidator,
  AdminForthFilterOperators, AdminForthDataTypes, AdminForthResourcePages, IHttpServer, 
  BeforeSaveFunction,
  AfterSaveFunction,
  AdminUser,
  AdminForthResource,
} from './types/AdminForthConfig.js';
import AdminForthPlugin from './basePlugin.js';
import ConfigValidator from './modules/configValidator.js';
import AdminForthRestAPI from './modules/restApi.js';
import ClickhouseConnector from './dataConnectors/clickhouse.js';

// exports
export * from './types/AdminForthConfig.js'; 
export { AdminForthPlugin };


class AdminForth implements IAdminForth {
  static Types = AdminForthDataTypes;

  static Utils = {
    generatePasswordHash: async (password) => {
      return await AdminForthAuth.generatePasswordHash(password);
    }
  }

  #defaultConfig = {
    deleteConfirmation: true,
  }

  config: AdminForthConfig;
  express: ExpressServer;
  auth: AdminForthAuth;
  codeInjector: CodeInjector;
  connectors;
  connectorClasses: any;
  runningHotReload: boolean;
  activatedPlugins: Array<AdminForthPlugin>;
  configValidator: IConfigValidator;
  restApi: AdminForthRestAPI;

  baseUrlSlashed: string;

  statuses: {
    dbDiscover: 'running' | 'done',
  }

  constructor(config: AdminForthConfig) {
    this.config = {...this.#defaultConfig,...config};
    this.codeInjector = new CodeInjector(this);
    this.configValidator = new ConfigValidator(this, this.config);
    this.restApi = new AdminForthRestAPI(this);
    this.activatedPlugins = [];
    
    this.configValidator.validateConfig();
    this.activatePlugins();
    this.configValidator.validateConfig();   // revalidate after plugins

    this.express = new ExpressServer(this);
    this.auth = new AdminForthAuth(this);
    this.connectors = {};
    this.statuses = {
      dbDiscover: 'running',
    };

    console.log(`🚀 AdminForth v${ADMINFORTH_VERSION} starting up`)
  }

  activatePlugins() {
    process.env.HEAVY_DEBUG && console.log('🔌🔌🔌 Activating plugins');
    for (let resource of this.config.resources) {
      for (let pluginInstance of resource.plugins || []) {
        pluginInstance.modifyResourceConfig(this, resource);
        this.activatedPlugins.push(pluginInstance);
      }
    };
  }

  async discoverDatabases() {
    this.statuses.dbDiscover = 'running';
    this.connectorClasses = {
      'sqlite': SQLiteConnector,
      'postgres': PostgresConnector,
      'mongodb': MongoConnector,
      'clickhouse': ClickhouseConnector,
    };
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = {...this.connectorClasses};
    }
    this.config.dataSources.forEach((ds) => {
      const dbType = ds.url.split(':')[0];
      if (!this.config.databaseConnectors[dbType]) {
        throw new Error(`Database type ${dbType} is not supported, consider using databaseConnectors in AdminForth config`);
      }
      this.connectors[ds.id] = new this.config.databaseConnectors[dbType]({url: ds.url});  
    });

    await Promise.all(this.config.resources.map(async (res) => {
      if (!this.connectors[res.dataSource]) {
        throw new Error(`Resource '${res.table}' refers to unknown dataSource '${res.dataSource}'`);
      }
      const fieldTypes = await this.connectors[res.dataSource].discoverFields(res);
      if (!Object.keys(fieldTypes).length) {
        throw new Error(`Table '${res.table}' (In resource '${res.resourceId}') has no fields or does not exist`);
      }

      if (!res.columns) {
        res.columns = Object.keys(fieldTypes).map((name) => ({ name }));
      }

      res.columns.forEach((col, i) => {
        if (!fieldTypes[col.name] && !col.virtual) {
          throw new Error(`Resource '${res.table}' has no column '${col.name}'`);
        }
        // first find discovered values, but allow override
        res.columns[i] = { ...fieldTypes[col.name], ...col };
      });

      this.configValidator.postProcessAfterDiscover(res);

      // check if primaryKey column is present
      if (!res.columns.some((col) => col.primaryKey)) {
        throw new Error(`Resource '${res.table}' has no column defined or auto-discovered. Please set 'primaryKey: true' in a columns which has unique value for each record and index`);
      }

    }));

    this.statuses.dbDiscover = 'done';

    // console.log('⚙️⚙️⚙️ Database discovery done', JSON.stringify(this.config.resources, null, 2));
  }

  async bundleNow({ hotReload=false }) {
    await this.codeInjector.bundleNow({ hotReload });
  }

  async getUserByPk(pk: string) {
    const resource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
    if (!resource) {
      throw new Error('No auth resource found');
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

  async createResourceRecord({ resource, record, adminUser }: { resource: AdminForthResource, record: any, adminUser: AdminUser }) {
    for (const column of resource.columns) {
        if (column.fillOnCreate) {
            if (record[column.name] === undefined) {
                record[column.name] = column.fillOnCreate({
                    initialRecord: record, adminUser
                 });
            }
        }
        if (
            (column.required as {create?: boolean, edit?: boolean}) ?.create &&
            record[column.name] === undefined &&
            column.showIn.includes(AdminForthResourcePages.create)
        ) {
            return { error: `Column '${column.name}' is required` };
        }

        if (column.isUnique) {
            const existingRecord = await this.connectors[resource.dataSource].getData({
                resource,
                filters: [{ field: column.name, operator: AdminForthFilterOperators.EQ, value: record[column.name] }],
                limit: 1,
                sort: [],
                offset: 0
            });
            if (existingRecord.data.length > 0) {
                return { error: `Record with ${column.name} ${record[column.name]} already exists` };
            }
        }
    }

    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.beforeSave as BeforeSaveFunction[])) {
      const resp = await hook({ resource, record, adminUser });
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
    process.env.HEAVY_DEBUG && console.log('🪲🪲🪲🪲 creating record createResourceRecord', record);
    await connector.createRecord({ resource, record });
    // execute hook if needed
    for (const hook of listify(resource.hooks?.create?.afterSave as AfterSaveFunction[])) {
      console.log('Hook afterSave', hook);
      const resp = await hook({ resource, record, adminUser });
      if (!resp || (!resp.ok && !resp.error)) {
        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
      }

      if (resp.error) {
        return { error: resp.error };
      }
    }

    return { ok: true };
  }

  setupEndpoints(server: IHttpServer) {
    this.restApi.registerEndpoints(server);
  }
}

export default AdminForth;