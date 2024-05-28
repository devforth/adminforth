
import Auth from './auth.js';
import MongoConnector from './dataConnectors/mongo.js';
import PostgresConnector from './dataConnectors/postgres.js';
import { guessLabelFromName } from './modules/utils.js';
import SQLiteConnector from './dataConnectors/sqlite.js';
import CodeInjector from './modules/codeInjector.js';
import ExpressServer from './servers/express.js';

import { AdminForthTypes } from './types.js';


const AVAILABLE_SHOW_IN = ['list', 'edit', 'create', 'filter', 'show'];

class AdminForth {
  constructor(config) {
    this.config = config;
    this.validateConfig();
    this.express = new ExpressServer(this);
    this.auth = new Auth();
    this.codeInjector = new CodeInjector(this);

    this.connectors = {};
    this.statuses = {}
    
  }

  validateConfig() {
    const errors = [];

    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }
    console.log('🙂 this.config', this.config);


    if (this.config.resources) {
      this.config.resources.forEach((res) => {
        if (!res.table) {
          errors.push(`Resource "${res.dataSource}" is missing table`);
        }
        // if itemLabel is not callable, throw error
        if (res.itemLabel && typeof res.itemLabel !== 'function') {
          errors.push(`Resource "${res.dataSource}" itemLabel is not a function`);
        }


        res.resourceId = res.resourceId || res.table;
        res.label = res.label || res.table.charAt(0).toUpperCase() + res.table.slice(1);
        if (!res.dataSource) {
          errors.push(`Resource "${res.resourceId}" is missing dataSource`);
        }
        if (!res.columns) {
          res.columns = [];
        }
        res.columns.forEach((col) => {
          col.label = col.label || guessLabelFromName(col.name);
          if (col.showIn && !Array.isArray(col.showIn)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" showIn must be an array`);
          }

          const wrongShowIn = col.showIn && col.showIn.find((c) => !AVAILABLE_SHOW_IN.includes(c));
          if (wrongShowIn) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid showIn value "${wrongShowIn}", allowed values are ${AVAILABLE_SHOW_IN.join(', ')}`);
          }
          col.showIn = col.showIn?.map(c => c.toLowerCase()) || AVAILABLE_SHOW_IN;
        })
      });
    }

    // check for duplicate resourceIds and show which ones are duplicated
    const resourceIds = this.config.resources.map((res) => res.resourceId);
    const uniqueResourceIds = new Set(resourceIds);
    if (uniqueResourceIds.size != resourceIds.length) {
      const duplicates = resourceIds.filter((item, index) => resourceIds.indexOf(item) != index);
      errors.push(`Duplicate fields "resourceId" or "table": ${duplicates.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }
  }

  async discoverDatabases() {
    this.statuses.dbDiscover = 'running';
    this.connectorClasses = {
      'sqlite': SQLiteConnector,
      'postgres': PostgresConnector,
      'mongodb': MongoConnector,
    };
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = {...this.connectorClasses};
    }
    this.config.dataSources.forEach((ds) => {
      const dbType = ds.url.split(':')[0];
      if (!this.config.databaseConnectors[dbType]) {
        throw new Error(`Database type ${dbType} is not supported, consider using databaseConnectors in AdminForth config`);
      }
      this.connectors[ds.id] = new this.config.databaseConnectors[dbType]({url: ds.url , fieldtypesByTable: ds.fieldtypesByTable});
    });

    await Promise.all(this.config.resources.map(async (res) => {
      if (!this.connectors[res.dataSource]) {
        throw new Error(`Resource '${res.table}' refers to unknown dataSource '${res.dataSource}'`);
      }
      const fieldTypes = await this.connectors[res.dataSource].discoverFields(res.table);
      if (!Object.keys(fieldTypes).length) {
        throw new Error(`Table '${res.table}' (In resource '${res.resourceId}') has no fields or does not exist`);
      }

      if (!res.columns) {
        res.columns = Object.keys(fieldTypes).map((name) => ({ name }));
      }

      res.columns.forEach((col, i) => {
        if (!fieldTypes[col.name]) {
          throw new Error(`Resource '${res.table}' has no column '${col.name}'`);
        }
        // first find discovered values, but allow override
        res.columns[i] = { ...fieldTypes[col.name], ...col };

      });

      // check if primaryKey column is present
      if (!res.columns.some((col) => col.primaryKey)) {
        throw new Error(`Resource '${res.table}' has no column defined or auto-discovered. Please set 'primaryKey: true' in a columns which has unique value for each record and index`);
      }

    }));

    this.statuses.dbDiscover = 'done';

    // console.log('⚙️⚙️⚙️ Database discovery done', JSON.stringify(this.config.resources, null, 2));
  }

  async init() {
    console.log('AdminForth init');
  }

  async bundleNow({ hotReload=false, verbose=false }) {
    this.codeInjector.bundleNow({ hotReload, verbose });
  }

  setupEndpoints(server) {
    server.endpoint({
      noAuth: true, // TODO
      method: 'GET',
      path: '/get_base_config',
      handler: async ({input}) => {
        return {
          resources: this.config.resources.map((res) => ({
            resourceId: res.resourceId,
            label: res.label,
          })),
          menu: this.config.menu,
          brandName: this.config.brandName,
        };
      },
    });
    server.endpoint({
      noAuth: true, // TODO
      method: 'POST',
      path: '/get_resource_columns',
      handler: async ({ body }) => {
        const { resourceId } = body;
        if (!this.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource ${resourceId} not found` };
        }
        return { resource };
      },
    });
    server.endpoint({
      noAuth: true, // TODO
      method: 'POST',
      path: '/get_resource_data',
      handler: async ({ body }) => {
        const { resourceId, limit, offset, filters, sort } = body;
        console.log('get_resource_data', body);

        if (!this.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource ${resourceId} not found` };
        }
        const data = await this.connectors[resource.dataSource].getData({
          resource,
          limit,
          offset,
          filters,
          sort,
        });
        return data;
      },
    });
    server.endpoint({
      noAuth: true, // TODO
      method: 'POST',
      path: '/get_min_max_for_columns',
      handler: async ({ body }) => {
        const { resourceId } = body;
        if (!this.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource '${resourceId}' not found` };
        }
        const item = await this.connectors[resource.dataSource].getMinMaxForColumns({
          resource,
          columns: resource.columns.filter((col) => [
            AdminForthTypes.INT, 
            AdminForthTypes.FLOAT,
            AdminForthTypes.DATE,
            AdminForthTypes.DATETIME,
            AdminForthTypes.TIME,
            AdminForthTypes.DECIMAL,
          ].includes(col.type) && col.allowMinMaxQuery === true),
        });
        return item;
      },
    });
    server.endpoint({
        noAuth: true, // TODO
        method: 'POST',
        path: '/get_record',
        handler: async ({ body }) => {
            console.log('get_record', body);
            const { resourceId, primaryKey } = body;
            const resource = this.config.resources.find((res) => res.resourceId == resourceId);
            const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
            const connector = this.connectors[resource.dataSource];
            const record = connector.getRecordByPrimaryKey(resource, primaryKey);
            const labler = resource.itemLabel || ((record) => `${resource.label} ${record[primaryKeyColumn.name]}`);
            record._label = labler(record);
            return record;
        }
      });
  }


}

export default AdminForth;