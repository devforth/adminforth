
import Auth from './auth.js';
import MongoConnector from './dataConnectors/mongo.js';
import PostgresConnector from './dataConnectors/postgres.js';
import SQLiteConnector from './dataConnectors/sqlite.js';
import CodeInjector from './modules/codeInjector.js';
import { guessLabelFromName } from './modules/utils.js';
import ExpressServer from './servers/express.js';
import {v1 as uuid} from 'uuid';
import fs from 'fs';


import { AdminForthFilterOperators, AdminForthTypes } from './types.js';

const AVAILABLE_SHOW_IN = ['list', 'edit', 'create', 'filter', 'show'];

type AdminForthConfigMenuItem = {
  label: string,
  icon?: string,
  path?: string,
  component?: string,
  resourceId?: string,
  homepage?: boolean,
  children?: Array<AdminForthConfigMenuItem>,
}

type AdminForthResourceColumn = {
  name: string,
  label?: string,
  type?: AdminForthTypes,
  primaryKey?: boolean,
  required?: boolean | { create: boolean, edit: boolean },
  editingNote?: string | { create: string, edit: string },
  showIn?: Array<string>,
  fillOnCreate?: Function,
  isUnique?: boolean,
  virtual?: boolean,
  allowMinMaxQuery?: boolean,
}

type AdminForthResource = {
  resourceId: string,
  label?: string,
  table: string,
  dataSource: string,
  columns: Array<AdminForthResourceColumn>,
  itemLabel?: Function,
  hooks?: {
    show?: Function,
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
    }>,
    allowDelete?: boolean,
  },
}

type AdminForthDataSource = {
  id: string,
  url: string,
}

type AdminForthConfig = {
  rootUser?: {
    username: string,
    password: string,
  },
  auth?: {
    resourceId: string,
    usernameField: string,
    passwordHashField: string,
    loginBackgroundImage?: string,
    userFullName?: string,
  },
  resources: Array<any>,
  menu: Array<AdminForthConfigMenuItem>,
  databaseConnectors?: any,
  dataSources: Array<any>,
  customization?: {
    customComponentsDir?: string,
    vueUsesFile?: string,
  },
  baseUrl?: string,
  brandName?: string,
  datesFormat?: string,
  deleteConfirmation?: boolean,
}

class AdminForth {
  static Types = AdminForthTypes;


  static Utils = {
    generatePasswordHash: async (password) => {
      return await Auth.generatePasswordHash(password);
    }
  }

  #defaultConfig = {
    deleteConfirmation: true,
    
    
  }

  config: AdminForthConfig;
  express: ExpressServer;
  auth: Auth;
  codeInjector: CodeInjector;
  connectors: any;
  connectorClasses: any;
  runningHotReload?: boolean;


  statuses: {
    dbDiscover?: 'running' | 'done',
  }


  constructor(config: AdminForthConfig) {
    this.config = {...this.#defaultConfig,...config};
    this.validateConfig();
    this.express = new ExpressServer(this);
    this.auth = new Auth();
    this.codeInjector = new CodeInjector(this);
    this.connectors = {};
    this.statuses = {}
  }

  validateConfig() {
    if (this.config.rootUser) {
      if (!this.config.rootUser.username) {
        throw new Error('rootUser.username is required');
      }
      if (!this.config.rootUser.password) {
        throw new Error('rootUser.password is required');
      }

      console.log('\n ⚠️⚠️⚠️ [INSECURE ALERT] config.rootUser is set, please create a new user and remove config.rootUser from config before going to production\n');
    }

    if (this.config.auth) {
      if (!this.config.auth.resourceId) {
        throw new Error('No config.auth.resourceId defined');
      }
      if (!this.config.auth.passwordHashField) {
        throw new Error('No config.auth.passwordHashField defined');
      }
      const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
      if (!userResource) {
        throw new Error(`Resource with id "${this.config.auth.resourceId}" not found`);
      }
    }

    if (!this.config.customization) {
      this.config.customization = {};
    }

    if (!this.config.customization.customComponentsDir) {
      this.config.customization.customComponentsDir = './custom';
    }


    const errors = [];
    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }
    if (!this.config.brandName) {
      this.config.brandName = 'AdminForth';
    }

    if (!this.config.datesFormat) {
      this.config.datesFormat = 'MMM D, YYYY HH:mm:ss';
    }

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
          //define default sortable
          if (!Object.keys(col).includes('sortable')) {col.sortable = true;}
          if (col.showIn && !Array.isArray(col.showIn)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" showIn must be an array`);
          }

          // check col.required is string or object
          if (col.required && !((typeof col.required === 'boolean') || (typeof col.required === 'object'))) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" required must be a string or object`);
          }

          // if it is object check the keys are one of ['create', 'edit']
          if (typeof col.required === 'object') {
            const wrongRequiredOn = Object.keys(col.required).find((c) => !['create', 'edit'].includes(c));
            if (wrongRequiredOn) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid required value "${wrongRequiredOn}", allowed keys are 'create', 'edit']`);
            }
          }

          // same for editingNote
          if (col.editingNote && !((typeof col.editingNote === 'string') || (typeof col.editingNote === 'object'))) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" editingNote must be a string or object`);
          }
          if (typeof col.editingNote === 'object') {
            const wrongEditingNoteOn = Object.keys(col.editingNote).find((c) => !['create', 'edit'].includes(c));
            if (wrongEditingNoteOn) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid editingNote value "${wrongEditingNoteOn}", allowed keys are 'create', 'edit']`);
            }
          }



          const wrongShowIn = col.showIn && col.showIn.find((c) => !AVAILABLE_SHOW_IN.includes(c));
          if (wrongShowIn) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid showIn value "${wrongShowIn}", allowed values are ${AVAILABLE_SHOW_IN.join(', ')}`);
          }
          col.showIn = col.showIn?.map(c => c.toLowerCase()) || AVAILABLE_SHOW_IN;
        })


        //check if resource has bulkActions
        if(res.options?.bulkActions){
          let bulkActions = res.options.bulkActions;

          if(!Array.isArray(bulkActions)){
            errors.push(`Resource "${res.resourceId}" bulkActions must be an array`);
            bulkActions = [];
          }
          if(res.options?.allowDelete){
            bulkActions.push({
              label: `Delete checked`,
              state: 'danger',
              icon: 'flowbite:trash-bin-outline',
              action: async ({selectedIds}) => {
                const connector = this.connectors[res.dataSource];
                await Promise.all(selectedIds.map(async (recordId) => {
                  await connector.deleteRecord({ resource: res, recordId });
                }));
              }
            });
          }  
          
          const newBulkActions = bulkActions.map((action) => {
            return Object.assign(action, {id: uuid()});
          });
          bulkActions = newBulkActions;
        }
      });

      if (!this.config.menu) {
        errors.push('No config.menu defined');
      }

      // check if there is only one homepage: true in menu, recursivly
      let homepages = 0;
      const browseMenu = (menu) => {
        menu.forEach((item) => {
          if (item.component && item.resourceId) {
            errors.push(`Menu item cannot have both component and resourceId: ${JSON.stringify(item)}`);
          }
          if (item.component && !item.path) {
            errors.push(`Menu item with component must have path : ${JSON.stringify(item)}`);
          }
          // make sure component starts with @@
          if (item.component) {
            if (!item.component.startsWith('@@')) {
              errors.push(`Menu item component must start with @@ : ${JSON.stringify(item)}`);
            }

            const path = item.component.replace('@@', this.config.customization.customComponentsDir);
            if ( !fs.existsSync(path) ) {
              errors.push(`Menu item component "${item.component.replace('@@', '')}" does not exist in "${this.config.customization.customComponentsDir}"`);
            }
          }

          if (item.homepage) {
            homepages++;
            if (homepages > 1) {
              errors.push('There must be only one homepage: true in menu, found second one in ' + JSON.stringify(item) );
            }
          }
          if (item.children) {
            browseMenu(item.children);
          }
        });
      };
      browseMenu(this.config.menu);

    }

    // check for duplicate resourceIds and show which ones are duplicated
    const resourceIds = this.config.resources.map((res) => res.resourceId);
    const uniqueResourceIds = new Set(resourceIds);
    if (uniqueResourceIds.size != resourceIds.length) {
      const duplicates = resourceIds.filter((item, index) => resourceIds.indexOf(item) != index);
      errors.push(`Duplicate fields "resourceId" or "table": ${duplicates.join(', ')}`);
    }

    //add ids for onSelectedAllActions for each resource
   



    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }
  }

  postProcessAfterDiscover(resource) {
    resource.columns.forEach((column) => {
      // if db/user says column is required in boolean, exapd
      if (typeof column.required === 'boolean') {
        column.required = { create: column.required, edit: column.required };
      }

      // same for editingNote
      if (typeof column.editingNote === 'string') {
        column.editingNote = { create: column.editingNote, edit: column.editingNote };
      }
    })
    resource.dataSourceColumns = resource.columns.filter((col) => !col.virtual);
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
        if (!fieldTypes[col.name] && !col.virtual) {
          throw new Error(`Resource '${res.table}' has no column '${col.name}'`);
        }
        // first find discovered values, but allow override
        res.columns[i] = { ...fieldTypes[col.name], ...col };
      });

      this.postProcessAfterDiscover(res);

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
      noAuth: true,
      method: 'POST',
      path: '/login',
      handler: async ({ body, response }) => {
        const INVALID_MESSAGE = 'Invalid username or password';
        const { username, password } = body;
        let token;
        if (username === this.config.rootUser.username && password === this.config.rootUser.password) {
          token = this.auth.issueJWT({ username, pk: null  });
        } else {
          // get resource from db
          if (!this.config.auth) {
            throw new Error('No config.auth defined');
          }
          const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
          const userRecord = await this.connectors[userResource.dataSource].getData({
            resource: userResource,
            filters: [
              { field: this.config.auth.usernameField, operator: AdminForthFilterOperators.EQ, value: username },
            ],
            limit: 1,
            offset: 0,
            sort: [],
          }).data[0];

          if (!userRecord) {
            return { error: 'User not found' };
          }

          const passwordHash = userRecord[this.config.auth.passwordHashField];
          console.log('User record', userRecord, passwordHash)  // why does it has no hash?
          const valid = await Auth.verifyPassword(password, passwordHash);
          if (valid) {
            token = this.auth.issueJWT({ 
              username, pk: userRecord[userResource.columns.find((col) => col.primaryKey).name]
            });
          } else {
            return { error: INVALID_MESSAGE };
          }
        }

        response.setHeader('Set-Cookie', `adminforth_jwt=${token}; Path=${this.config.baseUrl || '/'}; HttpOnly; SameSite=Strict`);
        return { ok: true };
      },
    });

    server.endpoint({
        noAuth: true,
        method: 'POST',
        path: '/logout',
        handler: async ({ response }) => {
          response.setHeader('Set-Cookie', `adminforth_jwt=; Path=${this.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
          return { ok: true };
        },
    })

    server.endpoint({
      noAuth: true,
      method: 'GET',
      path: '/get_public_config',
      handler: async ({ body }) => {

        // find resource
        if (!this.config.auth) {
          throw new Error('No config.auth defined');
        }
        const usernameField = this.config.auth.usernameField;
        const resource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
        const usernameColumn = resource.columns.find((col) => col.name === usernameField);

        return {
          brandName: this.config.brandName,
          usernameFieldName: usernameColumn.label,
          loginBackgroundImage: this.config.auth.loginBackgroundImage,
        };
      },
    });

    server.endpoint({
      method: 'GET',
      path: '/get_base_config',
      handler: async ({input, adminUser, cookies}) => {
        const cookieParsed = this.auth.verify(cookies['adminforth_jwt']);
        let username = ''
        let userFullName = ''
        if (cookieParsed['pk'] == null) {
            username = this.config.rootUser.username;
        } else {
            const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
            const user = await this.connectors[userResource.dataSource].getData({
              resource: userResource,
              filters: [
                { field: userResource.columns.find((col) => col.primaryKey).name, operator: AdminForthFilterOperators.EQ, value: cookieParsed['pk'] },
              ],
              limit: 1,
              offset: 0,
              sort: [],
            });
            if (!user.data.length) {
              return { error: 'Unauthorized' };
            }
            username = user.data[0][this.config.auth.usernameField]; 
            userFullName = user.data[0][this.config.auth.userFullName];
        }

        const userData = {
            [this.config.auth.usernameField]: username,
            [this.config.auth.userFullName]: userFullName
        };
        return {
          user: userData,
          resources: this.config.resources.map((res) => ({
            resourceId: res.resourceId,
            label: res.label,
          })),
          menu: this.config.menu,
          config: { 
            brandName: this.config.brandName,
            datesFormat: this.config.datesFormat,
            deleteConfirmation: this.config.deleteConfirmation,
            auth: this.config.auth,
            usernameField: this.config.auth.usernameField,
          },
          adminUser,
        };
      },
    });

    server.endpoint({
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
      method: 'POST',
      path: '/get_resource_data',
      handler: async ({ body }) => {
        const { resourceId, limit, offset, filters, sort } = body;
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
        return {...data, options: resource?.options };
      },
    });
    server.endpoint({
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
            AdminForthTypes.INTEGER, 
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
        method: 'POST',
        path: '/get_record',
        handler: async ({ body, adminUser }) => {
            const { resourceId, primaryKey } = body;
            const resource = this.config.resources.find((res) => res.resourceId == resourceId);
            const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
            const connector = this.connectors[resource.dataSource];
            const record = await connector.getRecordByPrimaryKey(resource, primaryKey);
            if (!record) {
                return { error: `Record with ${primaryKeyColumn.name} ${primaryKey} not found` };
            }
            
            // execute hook if needed
            if (resource.hooks?.show) {
                const resp = await resource.hooks?.show({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
                }

                if (resp.error) {
                  return { error: resp.error };
                }
              }

            const labler = resource.itemLabel || ((record) => `${resource.label} ${record[primaryKeyColumn.name]}`);
            record._label = labler(record);
            return record;
        }
      });
    server.endpoint({
        noAuth: true, // TODO
        method: 'POST',
        path: '/create_record',
        handler: async ({ body, adminUser }) => {
            console.log('create_record', body, this.config.resources);
            const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            
            const record = body['record'];
            // execute hook if needed
            if (resource.hooks?.create?.beforeSave) {
                const resp = await resource.hooks?.create?.beforeSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }

            for (const column of resource.columns) {
                if (column.fillOnCreate) {
                    if (body['record'][column.name] === undefined) {
                        body['record'][column.name] = column.fillOnCreate({
                            initialRecord: body['record'], adminUser
                         });
                    }
                }
                if (column.required?.create && body['record'][column.name] === undefined) {
                    return { error: `Column '${column.name}' is required` };
                }

                if (column.isUnique) {
                    const existingRecord = await this.connectors[resource.dataSource].getData({
                        resource,
                        filters: [{ field: column.name, operator: AdminForthFilterOperators.EQ, value: body['record'][column.name] }],
                        limit: 1,
                        sort: [],
                        offset: 0
                    });
                    if (existingRecord.data.length > 0) {
                        return { error: `Record with ${column.name} ${body['record'][column.name]} already exists` };
                    }
                }
            }

            // remove virtual columns from record
            for (const column of resource.columns.filter((col) => col.virtual)) {
                if (record[column.name]) {
                  delete record[column.name];
                }
            }
            const connector = this.connectors[resource.dataSource];
            await connector.createRecord({ resource, record });
            // execute hook if needed
            if (resource.hooks?.create?.afterSave) {
                const resp = await resource.hooks?.create?.afterSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }

            return {
              newRecordId: body['record'][connector.getPrimaryKey(resource)]
            }
        }
    });
    server.endpoint({
        noAuth: true, // TODO
        method: 'POST',
        path: '/update_record',
        handler: async ({ body, adminUser }) => {
            console.log('update_record', body);
            const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }

            const recordId = body['recordId'];
            const connector = this.connectors[resource.dataSource];
            const oldRecord = await connector.getRecordByPrimaryKey(resource, recordId)
            if (!oldRecord) {
                const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
                return { error: `Record with ${primaryKeyColumn.name} ${recordId} not found` };
            }
            const record = body['record'];

            // execute hook if needed
            if (resource.hooks?.edit?.beforeSave) {
                const resp = await resource.hooks?.edit?.beforeSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }

            const newValues = {};
            for (const col of resource.columns.filter((col) => !col.virtual)) {
                if (record[col.name] !== oldRecord[col.name]) {
                    newValues[col.name] = connector.setFieldValue(col, record[col.name]);
                }
            }
            if (Object.keys(newValues).length > 0) {
                await connector.updateRecord({ resource, recordId, record, newValues});
            }
            
            // execute hook if needed
            if (resource.hooks?.edit?.afterSave) {
                const resp = await resource.hooks?.edit?.afterSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }

            return {
              newRecordId: recordId
            }
        }
    });
    server.endpoint({
        noAuth: true, // TODO
        method: 'POST',
        path: '/delete_record',
        handler: async ({ body, adminUser }) => {
            const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }

            // execute hook if needed
            if (resource.hooks?.delete?.beforeSave) {
                const resp = await resource.hooks?.delete?.beforeSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }

            const connector = this.connectors[resource.dataSource];
            await connector.deleteRecord({ resource, recordId: body['primaryKey']});

            // execute hook if needed
            if (resource.hooks?.delete?.afterSave) {
                const resp = await resource.hooks?.delete?.afterSave({ resource, record, adminUser });
                if (!resp || (!resp.ok && !resp.error)) {
                  throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                }
  
                if (resp.error) {
                  return { error: resp.error };
                }
            }
            return {
              recordId: body['primaryKey']
            }
        }
    });
    server.endpoint({
        noAuth: true, // TODO
        method: 'POST',
        path: '/start_bulk_action',
        handler: async ({ body }) => {
            const { resourceId, actionId, recordIds } = body;
            const resource = this.config.resources.find((res) => res.resourceId == resourceId);
            if (!resource) {
                return { error: `Resource '${resourceId}' not found` };
            }
            const action = resource.options.bulkActions.find((act) => act.id == actionId);
            if (!action) {
                return { error: `Action '${actionId}' not found` };
            } else{
              await action.action({selectedIds:recordIds})

            }
            return {
              actionId,
              recordIds,
              resourceId,
              status:'success'
              
            }
        }
    })
  }
}

export default AdminForth;