
import ExpressServer from './servers/express.js';
import Auth from './auth.js';
import CodeInjector from './modules/codeInjector.js';
import SQLiteConnector from './connectors/sqlite.js';

class AdminForth {
  constructor(config) {
    this.config = config;
    this.validateConfig();
    this.express = new ExpressServer(this);
    this.auth = new Auth();
    this.codeInjector = new CodeInjector();

    this.connectors = {};
    this.discoverDatabases();

    
  }

  validateConfig() {
    const errors = [];

    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }

    if (this.config.resources) {
      this.config.resources.forEach((res) => {
        if (!res.table) {
          errors.push(`Resource ${res.dataSource} is missing table`);
        }
        res.resourceId = res.resourceId || res.table;
        if (!res.dataSource) {
          errors.push(`Resource ${res.resourceId} is missing dataSource`);
        }
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

  discoverDatabases() {
    this.connectorClasses = {
      'sqlite': SQLiteConnector,
    };
    if (!this.config.databaseConnectors) {
      this.config.databaseConnectors = {...this.connectorClasses};
    }
    this.config.dataSources.forEach((ds) => {
      const dbType = ds.url.split(':')[0];
      if (!this.config.databaseConnectors[dbType]) {
        throw new Error(`Database type ${dbType} is not supported, consider using databaseConnectors in AdminForth config`);
      }
      this.connectors[ds.id] = new this.config.databaseConnectors[dbType](ds.url);
    });

    this.config.resources.forEach((res) => {
      if (!this.connectors[res.dataSource]) {
        throw new Error(`Resource ${res.table} refers to unknown dataSource ${res.dataSource}`);
      }
      const fieldTypes = this.connectors[res.dataSource].discoverFieldTypes(res.table);

      res.columns.forEach((col) => {
        if (!fieldTypes[col.name]) {
          throw new Error(`Resource ${res.table} has no column ${col.name}`);
        }
        // first find discovered values, but allow override
        col = {...fieldTypes[col.name], ...col};
      });
    });
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
      path: '/get_menu_config',
      handler: async (input) => {
        return {
          resources: this.config.resources,
          menu: this.config.menu,
        };
      },
    });
  }


}

export default AdminForth;