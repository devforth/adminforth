import { 
  type IAdminForth, 
  type IHttpServer, type AdminUser, 
  AdminForthFilterOperators, 
  AdminForthDataTypes,
  BeforeLoginConfirmationFunction,
  AdminForthResource,
  AllowedActionValue,
  AllowedActionsEnum,
  AllowedActions,
  ActionCheckSource,
  BeforeSaveFunction,
  AfterDataSourceResponseFunction,
  BeforeDataSourceRequestFunction,
  AfterSaveFunction,
  AllowedActionsResolved

} from "../types/AdminForthConfig.js";

import { ADMINFORTH_VERSION, listify } from './utils.js';

import AdminForthAuth from "../auth.js";


export async function interpretResource(adminUser: AdminUser, resource: AdminForthResource, meta: any, source: ActionCheckSource): Promise<{allowedActions: AllowedActionsResolved}> {
  // if (process.env.HEAVY_DEBUG) {
  //   console.log('🪲Interpreting resource', resource.resourceId, source, 'adminUser', adminUser);
  // }
  const allowedActions = {};

  await Promise.all(
    Object.entries(resource.options?.allowedActions || {}).map(
      async ([key, value]: [string, AllowedActionValue]) => {
        if (process.env.HEAVY_DEBUG) {
          console.log('🪲checking for allowed call', key, 'value:', value, 'typeof', typeof value);
        }
      
        // if callable then call
        if (typeof value === 'function') {
          allowedActions[key] = await value({ adminUser, resource, meta, source });
        } else {
          allowedActions[key] = value;
        }
      })
  );

  return { allowedActions };
}

export default class AdminForthRestAPI {

  adminforth: IAdminForth;

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
  }

  registerEndpoints(server: IHttpServer) {
    server.endpoint({
      noAuth: true,
      method: 'POST',
      path: '/login',
      handler: async ({ body, response }) => {
       
        const INVALID_MESSAGE = 'Invalid username or password';
        const { username, password } = body;
        let adminUser: AdminUser;
        let toReturn: { ok: boolean, redirectTo?: string, allowedLogin:boolean } = { ok: true, allowedLogin:true};

        // get resource from db
        if (!this.adminforth.config.auth) {
          throw new Error('No config.auth defined we need it to find user, please follow the docs');
        }
        const userResource = this.adminforth.config.resources.find((res) => res.resourceId === this.adminforth.config.auth.usersResourceId);
        // if there is no passwordHashField, in columns, add it, with backendOnly and showIn: []
        if (!userResource.dataSourceColumns.find((col) => col.name === this.adminforth.config.auth.passwordHashField)) {
          userResource.dataSourceColumns.push({
            name: this.adminforth.config.auth.passwordHashField,
            backendOnly: true,
            showIn: [],
            type: AdminForthDataTypes.STRING,
          });
          console.log('Adding passwordHashField to userResource', userResource)
        }

        const userRecord = (
          await this.adminforth.connectors[userResource.dataSource].getData({
            resource: userResource,
            filters: [
              { field: this.adminforth.config.auth.usernameField, operator: AdminForthFilterOperators.EQ, value: username },
            ],
            limit: 1,
            offset: 0,
            sort: [],
          })
        ).data?.[0];

        if (!userRecord) {
          return { error: 'User not found' };
        }

        const passwordHash = userRecord[this.adminforth.config.auth.passwordHashField];
        const valid = await AdminForthAuth.verifyPassword(password, passwordHash);
        if (valid) {
          adminUser = { 
            dbUser: userRecord,
            pk: userRecord[userResource.columns.find((col) => col.primaryKey).name], 
            username,
          };
          const beforeLoginConfirmation = this.adminforth.config.auth.beforeLoginConfirmation as (BeforeLoginConfirmationFunction[] | undefined);
          if (beforeLoginConfirmation?.length){
            for (const hook of beforeLoginConfirmation) {
              const resp = await hook({ adminUser, response });
              
              if (resp?.body?.redirectTo) {
                toReturn = {ok:resp.ok, redirectTo:resp?.body?.redirectTo, allowedLogin:resp?.body?.allowedLogin};
                break;
              }
            }
          }
          if (toReturn.allowedLogin){
            this.adminforth.auth.setAuthCookie({ response, username, pk: userRecord[userResource.columns.find((col) => col.primaryKey).name] });
          } 
        } else {
          return { error: INVALID_MESSAGE };
        }
          
        
        return toReturn;
    }
    });

    server.endpoint({
      method: 'POST',
      path: '/check_auth',
      handler: async ({ adminUser }) => {
        return { ok: true };
      },
    });

    server.endpoint({
        noAuth: true,
        method: 'POST',
        path: '/logout',
        handler: async ({ response }) => {
          this.adminforth.auth.removeAuthCookie( response );
          return { ok: true };
        },
    })

    server.endpoint({
      noAuth: true,
      method: 'GET',
      path: '/get_public_config',
      handler: async ({ body }) => {

        // find resource
        if (!this.adminforth.config.auth) {
          throw new Error('No config.auth defined');
        }
        const usernameField = this.adminforth.config.auth.usernameField;
        const resource = this.adminforth.config.resources.find((res) => res.resourceId === this.adminforth.config.auth.usersResourceId);
        const usernameColumn = resource.columns.find((col) => col.name === usernameField);

        return {
          brandName: this.adminforth.config.customization.brandName,
          usernameFieldName: usernameColumn.label,
          loginBackgroundImage: this.adminforth.config.auth.loginBackgroundImage,
          title: this.adminforth.config.customization?.title,
          demoCredentials: this.adminforth.config.auth.demoCredentials,
          loginPromptHTML: this.adminforth.config.auth.loginPromptHTML,
        };
      },
    });

    server.endpoint({
      method: 'GET',
      path: '/get_base_config',
      handler: async ({input, adminUser, cookies}) => {
        let username = ''
        let userFullName = ''
    
        const dbUser = adminUser.dbUser;
        username = dbUser[this.adminforth.config.auth.usernameField]; 
        userFullName =dbUser[this.adminforth.config.auth.userFullNameField];

        const userData = {
            [this.adminforth.config.auth.usernameField]: username,
            [this.adminforth.config.auth.userFullNameField]: userFullName
        };
        const checkIsMenuItemVisible = (menuItem) => {
          if (typeof menuItem.visible === 'function') {
            const toReturn = menuItem.visible( adminUser );
            if (typeof toReturn !== 'boolean') {
              throw new Error(`'visible' function of ${menuItem.label || menuItem.type }  must return boolean value`);
            }
            return toReturn;
          }
        
          
        }

        async function processMenuItem(menuItem) {
            if (menuItem.badge) {
                if (typeof menuItem.badge === 'function') {
                    menuItem.badge = await menuItem.badge(adminUser);
                }
            }
        }
        let newMenu = []
        for (let menuItem of this.adminforth.config.menu) {
          let newMenuItem = {...menuItem,}
          if (menuItem.visible){
            if (!checkIsMenuItemVisible(menuItem)){
              continue
            }
          }
          if (menuItem.children){
            let newChildren = []
            for (let child of menuItem.children){
              let newChild = {...child,}
              if (child.visible){
                if (!checkIsMenuItemVisible(child)){
                  continue
                }
              }
              await processMenuItem(newChild)
              newChildren.push(newChild)
            }
            newMenuItem = {...newMenuItem, children: newChildren}
          }
          await processMenuItem(newMenuItem)
          newMenu.push(newMenuItem)
        }

        const announcementBadge = this.adminforth.config.customization.announcementBadge?.(adminUser);

        return {
          user: userData,
          resources: this.adminforth.config.resources.map((res) => ({
            resourceId: res.resourceId,
            label: res.label,
          })),
          menu: newMenu,
          config: { 
            brandName: this.adminforth.config.customization.brandName,
            brandLogo: this.adminforth.config.customization.brandLogo,
            datesFormat: this.adminforth.config.customization.datesFormat,
            deleteConfirmation: this.adminforth.config.deleteConfirmation,
            auth: this.adminforth.config.auth,
            usernameField: this.adminforth.config.auth.usernameField,
            title: this.adminforth.config.customization?.title,
            emptyFieldPlaceholder: this.adminforth.config.customization?.emptyFieldPlaceholder,
            announcementBadge,
          },
          adminUser,
          version: ADMINFORTH_VERSION,
        };
      },
    });

    

    function checkAccess(action: AllowedActionsEnum, allowedActions: AllowedActions): { allowed: boolean, error?: string } {
      const allowed = (allowedActions[action] as boolean | string | undefined);
      if (allowed !== true) {
        return { error: typeof allowed === 'string' ? allowed : 'Action is not allowed', allowed: false };
      }
      return { allowed: true };
    }
   
    server.endpoint({
      method: 'POST',
      path: '/get_resource',
      handler: async ({ body, adminUser }) => {
        const { resourceId } = body;
        if (!this.adminforth.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.adminforth.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource ${resourceId} not found` };
        }

        const { allowedActions } = await interpretResource(adminUser, resource, {}, ActionCheckSource.DisplayButtons);


        const allowedBulkActions = [];
        await Promise.all(
          resource.options.bulkActions.map(async (action) => {
            if (action.allowed) {
              const res = await action.allowed({ adminUser, resource, allowedActions });
              if (res) {
                allowedBulkActions.push(action);
              }
            }
          })
        );

        // exclude "plugins" key
        return { 
          resource: { 
            ...resource,
            plugins: undefined, 
            options: {
              ...resource.options,
              bulkActions: allowedBulkActions,
              allowedActions,
            } 
          }
        };
      },
    });
    server.endpoint({
      method: 'POST',
      path: '/get_resource_data',
      handler: async ({ body, adminUser }) => {
        const { resourceId, source } = body;
        if (['show', 'list'].includes(source) === false) {
          return { error: 'Invalid source, should be list or show' };
        }
        if (!this.adminforth.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.adminforth.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource ${resourceId} not found` };
        }

        const { allowedActions } = await interpretResource(adminUser, resource, { requestBody: body }, ActionCheckSource.DisplayButtons);

        const { allowed, error } = checkAccess(source as AllowedActionsEnum, allowedActions);
        if (!allowed) {
          return { error };
        }

        for (const hook of listify(resource.hooks?.[source]?.beforeDatasourceRequest)) {
          const resp = await hook({ resource, query: body, adminUser });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }
        const { limit, offset, filters, sort } = body;

        

        for (const filter of (filters || [])) {
          if (!Object.values(AdminForthFilterOperators).includes(filter.operator)) {
              throw new Error(`Operator '${filter.operator}' is not allowed`);
          }

          if (!resource.columns.some((col) => col.name === filter.field)) {
              throw new Error(`Field '${filter.field}' is not in resource '${resource.resourceId}'. Available fields: ${resource.columns.map((col) => col.name).join(', ')}`);
          }

          if (filter.operator === AdminForthFilterOperators.IN || filter.operator === AdminForthFilterOperators.NIN) {
              if (!Array.isArray(filter.value)) {
                  throw new Error(`Value for operator '${filter.operator}' should be an array`);
              }
          }

          if (filter.operator === AdminForthFilterOperators.IN && filter.value.length === 0) {
              // nonsense
              return { data: [], total: 0 };
          }
        }

        const data = await this.adminforth.connectors[resource.dataSource].getData({
          resource,
          limit,
          offset,
          filters,
          sort,
        });
        // for foreign keys, add references
        await Promise.all(
          resource.columns.filter((col) => col.foreignResource).map(async (col) => {
            const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == col.foreignResource.resourceId);
            const targetConnector = this.adminforth.connectors[targetResource.dataSource];
            const targetResourcePkField = targetResource.columns.find((col) => col.primaryKey).name;
            const pksUnique = [...new Set(data.data.map((item) => item[col.name]))];
            if (pksUnique.length === 0) {
              return;
            }
            const targetData = await targetConnector.getData({
              resource: targetResource,
              limit: limit,
              offset: 0,
              filters: [
                {
                  field: targetResourcePkField,
                  operator: AdminForthFilterOperators.IN,
                  value: pksUnique,
                }
              ],
              sort: [],
            });
            const targetDataMap = targetData.data.reduce((acc, item) => {
              acc[item[targetResourcePkField]] = {
                label: targetResource.recordLabel(item),
                pk: item[targetResourcePkField],
              }
              return acc;
            }, {});
            data.data.forEach((item) => {
              item[col.name] = targetDataMap[item[col.name]];
            });
          })
        );

        // remove all columns which are not defined in resources, or defined but backendOnly
        data.data.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (!resource.columns.find((col) => col.name === key) || resource.columns.find((col) => col.name === key && col.backendOnly)) {
              delete item[key];
            }
          })
        });

        data.data.forEach((item) => {
          item._label = resource.recordLabel(item);
        });

        // only after adminforth made all post processing, give user ability to edit it
        for (const hook of listify(resource.hooks?.[source]?.afterDatasourceResponse)) {
          const resp = await hook({ resource, response: data.data, adminUser });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }

        return {
          ...data, 
          options: resource?.options,
        };
      },
    });
    server.endpoint({
      method: 'POST',
      path: '/get_resource_foreign_data',
      handler: async ({ body, adminUser }) => {
        const { resourceId, column } = body;
        if (!this.adminforth.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.adminforth.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource '${resourceId}' not found` };
        }
        const columnConfig = resource.columns.find((col) => col.name == column);
        if (!columnConfig) {
          return { error: `Column "${column}' not found in resource with resourceId '${resourceId}'` };
        }
        if (!columnConfig.foreignResource) {
          return { error: `Column '${column}' in resource '${resourceId}' is not a foreign key` };
        }
        const targetResourceId = columnConfig.foreignResource.resourceId;
        const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == targetResourceId);

        for (const hook of listify(columnConfig.foreignResource.hooks?.dropdownList?.beforeDatasourceRequest as BeforeDataSourceRequestFunction[])) {
          const resp = await hook({ query: body, adminUser, resource: targetResource });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }
        const { limit, offset, filters, sort } = body;
        const dbDataItems = await this.adminforth.connectors[targetResource.dataSource].getData({
          resource: targetResource,
          limit,
          offset,
          filters: filters || [],
          sort: sort || [],
        });
        const items = dbDataItems.data.map((item) => {
          const pk = item[targetResource.columns.find((col) => col.primaryKey).name];
          const labler = targetResource.recordLabel;
          return { 
            value: pk,
            label: labler(item),
            _item: item, // user might need it in hook to form new label
          }
        });
        const response = {
          items
        };

        for (const hook of listify(columnConfig.foreignResource.hooks?.dropdownList?.afterDatasourceResponse as AfterDataSourceResponseFunction[])) {
          const resp = await hook({ response, adminUser, resource: targetResource });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }
       
        return response;
      },
    });

    server.endpoint({
      method: 'POST',
      path: '/get_min_max_for_columns',
      handler: async ({ body }) => {
        const { resourceId } = body;
        if (!this.adminforth.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.adminforth.statuses.dbDiscover !== 'done') {
          return { error : 'Database discovery is still in progress, please try later' };
        }
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource '${resourceId}' not found` };
        }
        const item = await this.adminforth.connectors[resource.dataSource].getMinMaxForColumns({
          resource,
          columns: resource.columns.filter((col) => [
            AdminForthDataTypes.INTEGER, 
            AdminForthDataTypes.FLOAT,
            AdminForthDataTypes.DATE,
            AdminForthDataTypes.DATETIME,
            AdminForthDataTypes.TIME,
            AdminForthDataTypes.DECIMAL,
          ].includes(col.type) && col.allowMinMaxQuery === true),
        });
        return item;
      },
    });
    server.endpoint({
        method: 'POST',
        path: '/create_record',
        handler: async ({ body, adminUser }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            const { allowedActions } = await interpretResource(adminUser, resource, { requestBody: body}, ActionCheckSource.CreateRequest);

            const { allowed, error } = checkAccess(AllowedActionsEnum.create, allowedActions);
            if (!allowed) {
              return { error };
            }

            const { record } = body;

            const response = await this.adminforth.createResourceRecord({ resource, record, adminUser });
            if (response.error) {
              return { error: response.error };
            }
            const connector = this.adminforth.connectors[resource.dataSource];

            return {
              newRecordId: record[connector.getPrimaryKey(resource)]
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/update_record',
        handler: async ({ body, adminUser }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            
            const recordId = body['recordId'];
            const connector = this.adminforth.connectors[resource.dataSource];
            const oldRecord = await connector.getRecordByPrimaryKey(resource, recordId)
            if (!oldRecord) {
                const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
                return { error: `Record with ${primaryKeyColumn.name} ${recordId} not found` };
            }
            const record = body['record'];

            const { allowedActions } = await interpretResource(adminUser, resource, { requestBody: body, newRecord: record, oldRecord}, ActionCheckSource.EditRequest);

            const { allowed, error } = checkAccess(AllowedActionsEnum.edit, allowedActions);
            if (!allowed) {
              return { error };
            }

            // execute hook if needed
            for (const hook of listify(resource.hooks?.edit?.beforeSave as BeforeSaveFunction[])) {
              const resp = await hook({
                recordId,
                resource,
                record,
                adminUser 
              });
              if (!resp || (!resp.ok && !resp.error)) {
                throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
              }

              if (resp.error) {
                return { error: resp.error };
              }
            }
            const newValues = {};

            for (const recordField in record) {
              if (record[recordField] !== oldRecord[recordField]) {
                const column = resource.columns.find((col) => col.name === recordField);
                if (column) {
                  if (!column.virtual) {
                    newValues[recordField] = connector.setFieldValue(column, record[recordField]);
                  }
                } else {
                  newValues[recordField] = record[recordField];
                }
              }
            } 

            if (Object.keys(newValues).length > 0) {
                await connector.updateRecord({ resource, recordId, newValues});
            }
            
            // execute hook if needed
            for (const hook of listify(resource.hooks?.edit?.afterSave as AfterSaveFunction[])) {
              const resp = await hook({ 
                resource, 
                record, 
                adminUser, 
                oldRecord,
                recordId,
              });
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
        method: 'POST',
        path: '/delete_record',
        handler: async ({ body, adminUser }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            const record = await this.adminforth.connectors[resource.dataSource].getRecordByPrimaryKey(resource, body['primaryKey']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            if (!record){
                return { error: `Record with ${body['primaryKey']} not found` };
            }
            if (resource.options.allowedActions.delete === false) {
                return { error: `Resource '${resource.resourceId}' does not allow delete action` };
            }

            const { allowedActions } = await interpretResource(adminUser, resource, { requestBody: body }, ActionCheckSource.DeleteRequest);

            const { allowed, error } = checkAccess(AllowedActionsEnum.delete, allowedActions);
            if (!allowed) {
              return { error };
            }

            // execute hook if needed
            for (const hook of listify(resource.hooks?.delete?.beforeSave as BeforeSaveFunction[])) {
              const resp = await hook({ 
                resource, 
                record, 
                adminUser,
                recordId: body['primaryKey']
              });
              if (!resp || (!resp.ok && !resp.error)) {
                throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
              }

              if (resp.error) {
                return { error: resp.error };
              }
            }

            const connector = this.adminforth.connectors[resource.dataSource];
            await connector.deleteRecord({ resource, recordId: body['primaryKey']});

            // execute hook if needed
            for (const hook of listify(resource.hooks?.delete?.afterSave as BeforeSaveFunction[])) {
              const resp = await hook({ 
                resource, 
                record, 
                adminUser,
                recordId: body['primaryKey']
              });
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
        method: 'POST',
        path: '/start_bulk_action',
        handler: async ({ body, adminUser }) => {
            const { resourceId, actionId, recordIds } = body;
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
            if (!resource) {
                return { error: `Resource '${resourceId}' not found` };
            }
            const { allowedActions } = await interpretResource(adminUser, resource, { requestBody: body }, ActionCheckSource.BulkActionRequest);

            const action = resource.options.bulkActions.find((act) => act.id == actionId);
            if (!action) {
              return { error: `Action '${actionId}' not found` };
            } 
            
            const execAllowed = await action.allowed({ adminUser, resource, selectedIds: recordIds, allowedActions });
            if (!execAllowed) {
              return { error: `Action '${actionId}' is not allowed` };
            }
            const response = await action.action({selectedIds: recordIds, adminUser, resource});
            
            return {
              actionId,
              recordIds,
              resourceId,
              ...response
            }
        }
    })

    // setup endpoints for all plugins
    this.adminforth.activatedPlugins.forEach((plugin) => {
      plugin.setupEndpoints(server);
    });
  }
}