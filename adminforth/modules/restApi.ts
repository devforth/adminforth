import { 
  type IAdminForth, 
  type IHttpServer,
  BeforeLoginConfirmationFunction,
  AdminForthResource,
  AllowedActionValue,
  AllowedActions,
  AfterDataSourceResponseFunction,
  BeforeDataSourceRequestFunction,
  IAdminForthRestAPI,
  IAdminForthSort,
  HttpExtra,
} from "../types/Back.js";

import { ADMINFORTH_VERSION, listify, md5hash } from './utils.js';

import AdminForthAuth from "../auth.js";
import { ActionCheckSource, AdminForthConfigMenuItem, AdminForthDataTypes, AdminForthFilterOperators, AdminForthResourceCommon, AdminForthResourcePages,
   AdminUser, AllowedActionsEnum, AllowedActionsResolved, 
   AnnouncementBadgeResponse,
   GetBaseConfigResponse,
   ShowInResolved} from "../types/Common.js";

export async function interpretResource(
  adminUser: AdminUser, 
  resource: AdminForthResource, 
  meta: any, 
  source: ActionCheckSource, 
  adminforth: IAdminForth
): Promise<{allowedActions: AllowedActionsResolved}> {
  // if (process.env.HEAVY_DEBUG) {
  //   console.log('🪲Interpreting resource', resource.resourceId, source, 'adminUser', adminUser);
  // }
  const allowedActions = {} as AllowedActionsResolved;

  // we need to compute only allowed actions for this source:
  // 'show' needed for ActionCheckSource.showRequest and ActionCheckSource.editLoadRequest and ActionCheckSource.displayButtons
  // 'edit' needed for ActionCheckSource.editRequest and ActionCheckSource.displayButtons
  // 'delete' needed for ActionCheckSource.deleteRequest and ActionCheckSource.displayButtons and ActionCheckSource.bulkActionRequest
  // 'list' needed for ActionCheckSource.listRequest
  // 'create' needed for ActionCheckSource.createRequest and ActionCheckSource.displayButtons
  // for bulk actions we need to check all actions because bulk action can use any of them e.g sync allowed with edit
  const neededActions = {
    [ActionCheckSource.ShowRequest]: ['show'],
    [ActionCheckSource.EditRequest]: ['edit'],
    [ActionCheckSource.EditLoadRequest]: ['show'],
    [ActionCheckSource.DeleteRequest]: ['delete'],
    [ActionCheckSource.ListRequest]: ['list'],
    [ActionCheckSource.CreateRequest]: ['create'],
    [ActionCheckSource.DisplayButtons]: ['show', 'edit', 'delete', 'create', 'filter'],
    [ActionCheckSource.BulkActionRequest]: ['show', 'edit', 'delete', 'create', 'filter'],
  }[source];

  await Promise.all(
    Object.entries(resource.options.allowedActions).map(
      async ([key, value]: [string, AllowedActionValue]) => {
        if (process.env.HEAVY_DEBUG) {
          console.log(`🪲🚥check allowed ${key}, ${value}`)
        }
        if (!neededActions.includes(key as AllowedActionsEnum)) {
          allowedActions[key] = false;
          return;
        }
      
        // if callable then call
        if (typeof value === 'function') {
          allowedActions[key] = await value({ adminUser, resource, meta, source, adminforth });
        } else {
          allowedActions[key] = value;
        }
      })
  );

  return { allowedActions };
}

export default class AdminForthRestAPI implements IAdminForthRestAPI {

  adminforth: IAdminForth;

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
  }

  async processLoginCallbacks(adminUser: AdminUser, toReturn: { redirectTo?: string, allowedLogin:boolean, error?: string }, response: any, extra: HttpExtra) {
    const beforeLoginConfirmation = this.adminforth.config.auth.beforeLoginConfirmation as (BeforeLoginConfirmationFunction[] | undefined);
    if (beforeLoginConfirmation?.length){
      for (const hook of beforeLoginConfirmation) {
        const resp = await hook({ 
          adminUser, 
          response,
          adminforth: this.adminforth,
          extra,
        });
        
        if (resp?.body?.redirectTo || resp?.error) {
          // delete all items from toReturn and add these:
          toReturn.redirectTo = resp?.body?.redirectTo;
          toReturn.allowedLogin = resp?.body?.allowedLogin;
          toReturn.error = resp?.error;
          break;
        }
      }
    }
  }

  registerEndpoints(server: IHttpServer) {
    server.endpoint({
      noAuth: true,
      method: 'POST',
      path: '/login',
      handler: async ({ body, response, headers, query, cookies, requestUrl, tr }) => {
       
        const INVALID_MESSAGE = await tr('Invalid username or password', 'errors');
        const { username, password, rememberMe } = body;
        let adminUser: AdminUser;
        let toReturn: { redirectTo?: string, allowedLogin:boolean, error?: string } = { allowedLogin: true };

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
            showIn: Object.values(AdminForthResourcePages).reduce((acc, page) => { return { ...acc, [page]: false } }, {} as ShowInResolved),
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
          return { error: INVALID_MESSAGE };
        }

        const passwordHash = userRecord[this.adminforth.config.auth.passwordHashField];
        const valid = await AdminForthAuth.verifyPassword(password, passwordHash);
        if (valid) {
          adminUser = { 
            dbUser: userRecord,
            pk: userRecord[userResource.columns.find((col) => col.primaryKey).name], 
            username,
          };
          await this.processLoginCallbacks(adminUser, toReturn, response, { body, headers, query, cookies, requestUrl });

          if (toReturn.allowedLogin) {
            const expireInDays = rememberMe && this.adminforth.config.auth.rememberMeDays;
            this.adminforth.auth.setAuthCookie({ 
              expireInDays,
              response, 
              username, 
              pk: userRecord[userResource.columns.find((col) => col.primaryKey).name] 
            });
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
      handler: async ({ tr }) => {

        // TODO we need to remove this method and make get_config to return public and private parts for logged in user and only public for not logged in

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
          loginBackgroundPosition: this.adminforth.config.auth.loginBackgroundPosition,
          title: this.adminforth.config.customization?.title,
          demoCredentials: this.adminforth.config.auth.demoCredentials,
          loginPromptHTML: await tr(this.adminforth.config.auth.loginPromptHTML, 'system.loginPromptHTML'),
          loginPageInjections: this.adminforth.config.customization.loginPageInjections,
          globalInjections: {
            everyPageBottom: this.adminforth.config.customization.globalInjections.everyPageBottom,
          },
          rememberMeDays: this.adminforth.config.auth.rememberMeDays,
        };
      },
    });

    
    server.endpoint({
      method: 'GET',
      path: '/get_base_config',
      handler: async ({input, adminUser, cookies, tr}): Promise<GetBaseConfigResponse>=> {
        let username = ''
        let userFullName = ''
    
        // find resource
        if (!this.adminforth.config.auth) {
          throw new Error('No config.auth defined');
        }

        const dbUser = adminUser.dbUser;
        username = dbUser[this.adminforth.config.auth.usernameField]; 
        userFullName = dbUser[this.adminforth.config.auth.userFullNameField];
        const userResource = this.adminforth.config.resources.find((res) => res.resourceId === this.adminforth.config.auth.usersResourceId);
        
        const usernameField = this.adminforth.config.auth.usernameField;
        const usernameColumn = userResource.columns.find((col) => col.name === usernameField);

        const userPk = dbUser[userResource.columns.find((col) => col.primaryKey).name];

        const userData = {
            [this.adminforth.config.auth.usernameField]: username,
            [this.adminforth.config.auth.userFullNameField]: userFullName,
            pk: userPk,
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

        let newMenu = []
        for (let menuItem of this.adminforth.config.menu) {
          let newMenuItem = {...menuItem,}
          if (menuItem.visible){
            if (!checkIsMenuItemVisible(menuItem)){
              continue
            }
          }
          if (menuItem.children) {
            let newChildren = []
            for (let child of menuItem.children){
              let newChild = {...child,}
              if (child.visible){
                if (!checkIsMenuItemVisible(child)){
                  continue
                }
              }
              newChildren.push(newChild)
            }
            newMenuItem = {...newMenuItem, children: newChildren}
          }
          newMenu.push(newMenuItem)
        }

        const announcementBadge: AnnouncementBadgeResponse = this.adminforth.config.customization.announcementBadge?.(adminUser);

        const publicPart = {
          brandName: this.adminforth.config.customization.brandName,
          usernameFieldName: usernameColumn.label,
          loginBackgroundImage: this.adminforth.config.auth.loginBackgroundImage,
          loginBackgroundPosition: this.adminforth.config.auth.loginBackgroundPosition,
          title: this.adminforth.config.customization?.title,
          demoCredentials: this.adminforth.config.auth.demoCredentials,
          loginPromptHTML: await tr(this.adminforth.config.auth.loginPromptHTML, 'system.loginPromptHTML'),
          loginPageInjections: this.adminforth.config.customization.loginPageInjections,
          rememberMeDays: this.adminforth.config.auth.rememberMeDays,
        }

        const loggedInPart = {
          showBrandNameInSidebar: this.adminforth.config.customization.showBrandNameInSidebar,
          brandLogo: this.adminforth.config.customization.brandLogo,
          datesFormat: this.adminforth.config.customization.datesFormat,
          timeFormat: this.adminforth.config.customization.timeFormat,
          auth: this.adminforth.config.auth,
          usernameField: this.adminforth.config.auth.usernameField,
          title: this.adminforth.config.customization.title,
          emptyFieldPlaceholder: this.adminforth.config.customization.emptyFieldPlaceholder,
          announcementBadge,
          globalInjections: this.adminforth.config.customization.globalInjections,
          userFullnameField: this.adminforth.config.auth.userFullNameField,
        }

        // translate menu labels
        const translateRoutines: Promise<void>[] = [];

        const processItem = (menuItem) => {
          if (menuItem.label) {
            translateRoutines.push(
              (async () => {
                menuItem.label = await tr(menuItem.label, `menu.${menuItem.itemId}`);
              })()
            );
          }
          if (menuItem.badgeTooltip) {
            translateRoutines.push(
              (async () => {
                menuItem.badgeTooltip = await tr(menuItem.badgeTooltip, `menu.${menuItem.itemId}`);
              })()
            );
          }
          if (menuItem.children) {
            menuItem.children.forEach(processItem);
          }
        }
        newMenu.forEach((menuItem) => {
          processItem(menuItem);
        });
        await Promise.all(translateRoutines);

        // strip all backendOnly fields or not described in adminForth fields from dbUser
        // (when user defines column and does not set backendOnly, we assume it is not backendOnly)
        Object.keys(adminUser.dbUser).forEach((key) => {
          const col = userResource.columns.find((col) => col.name === key);
          if (!col || col.backendOnly) {
            delete adminUser.dbUser[key];
          }
        })

        return {
          user: userData,
          resources: this.adminforth.config.resources.map((res) => ({
            resourceId: res.resourceId,
            label: res.label,
          })),
          menu: newMenu,
          config: { 
            ...publicPart,
            ...loggedInPart,
          },
          adminUser,
          version: ADMINFORTH_VERSION,
        };
      },
    });

    server.endpoint({
      method: 'GET', 
      path: '/get_menu_badges',
      handler: async ({ adminUser }) => {
        const badges = {};

        const badgeFunctions = [];

        function processMenuItem(menuItem) {
          if (menuItem.badge) {
            if (typeof menuItem.badge === 'function') {
              badgeFunctions.push(async () => {
                badges[menuItem.itemId] = await menuItem.badge(adminUser);
              });
            } else {
              badges[menuItem.itemId] = menuItem.badge;
            }
          }
          if (menuItem.children) {
            menuItem.children.forEach(processMenuItem);
          }
        }

        this.adminforth.config.menu.map((menuItem) => {
          processMenuItem(menuItem)
        })

        await Promise.all(badgeFunctions.map((fn) => fn()));
        return badges;
      }
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
      handler: async ({ body, adminUser, tr }): Promise<{ resource?: AdminForthResourceCommon, error?: string }> => {
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

        const { allowedActions } = await interpretResource(adminUser, resource, {}, ActionCheckSource.DisplayButtons, this.adminforth);

        const allowedBulkActions = [];
        await Promise.all(
          resource.options.bulkActions.map(async (action) => {
            if (action.allowed) {
              const res = await action.allowed({ adminUser, resource, allowedActions });
              if (res) {
                allowedBulkActions.push(action);
              }
            } else {
              allowedBulkActions.push(action);
            }
          })
        );

        // translate
        const translateRoutines: Record<string, Promise<string>> = {};
        translateRoutines.resLabel = tr(resource.label, `resource.${resource.resourceId}`);
        resource.columns.forEach((col, i) => {
          translateRoutines[`resCol${i}`] = tr(col.label, `resource.${resource.resourceId}`);
        })
        allowedBulkActions.forEach((action, i) => {
          if (action.label) {
            translateRoutines[`bulkAction${i}`] = tr(action.label, `resource.${resource.resourceId}`);
          }
          if (action.confirm) {
            translateRoutines[`bulkActionConfirm${i}`] = tr(action.confirm, `resource.${resource.resourceId}`);
          }
        });

        const translated: Record<string, string> = {};
        await Promise.all(
          Object.entries(translateRoutines).map(async ([key, value]) => {
            translated[key] = await value;
          })
        );

        
        const toReturn = {
            ...resource,
            label: translated.resLabel,
            columns:
              await Promise.all(
                resource.columns.map(
                  async (col, i) => {
                    let validation = null;
                    if (col.validation) {
                      validation = await Promise.all(                  
                        col.validation.map(async (val) => {
                          return  {
                            ...val,
                            message: await tr(val.message, `resource.${resource.resourceId}`),
                          }
                        })
                      );
                    }
                    let enumItems = undefined;
                    if (col.enum) {
                      enumItems = await Promise.all(
                        col.enum.map(async (item) => {
                          return {
                            ...item,
                            label: await tr(item.label, `resource.${resource.resourceId}.enum.${col.name}`),
                          }
                        })
                      );
                    }
                    const showIn = {} as ShowInResolved;
                    await Promise.all(
                      Object.entries(col.showIn).map(
                        async ([key, value]: [string, AllowedActionValue]) => {
                          // if callable then call
                          if (typeof value === 'function') {
                            showIn[key] = await value({ adminUser, resource, meta: {}, source: ActionCheckSource.DisplayButtons, adminforth: this.adminforth });
                          } else {
                            showIn[key] = value;
                          }
                        })
                    );
                    // TODO: better to move all coroutines to translationRoutines
                    if (col.editingNote?.create) {
                      col.editingNote.create = await tr(col.editingNote.create, `resource.${resource.resourceId}.editingNote.create`);
                    }
                    if (col.editingNote?.edit) {
                      col.editingNote.edit = await tr(col.editingNote.edit, `resource.${resource.resourceId}.editingNote.edit`);
                    }

                    return {
                      ...col,
                      showIn,
                      validation,
                      label: translated[`resCol${i}`],
                      enum: enumItems,
                    }
                  }
                ),
            ),
            options: {
              ...resource.options,
              bulkActions: allowedBulkActions.map(
                (action, i) => ({
                  ...action,
                  label: action.label ? translated[`bulkAction${i}`] : action.label,
                  confirm: action.confirm ? translated[`bulkActionConfirm${i}`] : action.confirm,
                })
              ),
              allowedActions,
            } 
        }
        delete toReturn.hooks;
        delete toReturn.plugins;

        return { 
          resource: toReturn,
        };
      },
    });
    server.endpoint({
      method: 'POST',
      path: '/get_resource_data',
      handler: async ({ body, adminUser, headers, query, cookies, requestUrl }) => {
        const { resourceId, source } = body;
        if (['show', 'list', 'edit'].includes(source) === false) {
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

        const meta = { requestBody: body, pk: undefined };
        if (source === 'edit' || source === 'show') {
          meta.pk = body.filters.find((f) => f.field === resource.columns.find((col) => col.primaryKey).name)?.value;
        }

        const { allowedActions } = await interpretResource(
          adminUser,
          resource,
          meta,
          {
            'show': ActionCheckSource.ShowRequest,
            'list': ActionCheckSource.ListRequest,
            'edit': ActionCheckSource.EditLoadRequest,
          }[source],
          this.adminforth
        );

        const { allowed, error } = checkAccess({
          'show': AllowedActionsEnum.show,
          'list': AllowedActionsEnum.list,
          'edit': AllowedActionsEnum.show // here we check show, bacuse by convention show request is called for edit
        }[source], allowedActions);

        if (!allowed) {
          return { error };
        }

        const hookSource = {
          'show': 'show',
          'list': 'list',
          'edit': 'show',
        }[source];

        for (const hook of listify(resource.hooks?.[hookSource]?.beforeDatasourceRequest)) {
          const resp = await hook({
            resource,
            query: body,
            adminUser,
            extra: {
              body, query, headers, cookies, requestUrl
            },
            adminforth: this.adminforth,
          });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }
        const { limit, offset, filters, sort } = body;

        // remove virtual fields from sort if still presented after
        // beforeDatasourceRequest hook
        const sortFiltered = sort.filter((sortItem: IAdminForthSort) => {
          return !resource.columns.find((col) => col.name === sortItem.field && col.virtual);
        });

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
        }

        const data = await this.adminforth.connectors[resource.dataSource].getData({
          resource,
          limit,
          offset,
          filters,
          sort: sortFiltered,
          getTotals: true,
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
          item._label = resource.recordLabel(item);
        });
        if (resource.options.listTableClickUrl) {
          await Promise.all(
            data.data.map(async (item) => {
                item._clickUrl = await resource.options.listTableClickUrl(item, adminUser);
            })
          );
        }

        // only after adminforth made all post processing, give user ability to edit it
        for (const hook of listify(resource.hooks?.[hookSource]?.afterDatasourceResponse)) {
          const resp = await hook({
            resource,
            query: body,
            response: data.data,
            adminUser,
            extra: {
              body, query, headers, cookies, requestUrl
            },
            adminforth: this.adminforth,
          });

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
      handler: async ({ body, adminUser, headers, query, cookies, requestUrl }) => {
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
          const resp = await hook({ 
            query: body, 
            adminUser, 
            resource: targetResource, 
            extra: {
              body, query, headers, cookies, requestUrl
            },
            adminforth: this.adminforth,
          });
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
          const resp = await hook({ 
            response, 
            adminUser, 
            query: body,
            resource: targetResource,
            extra: {
              body, query, headers, cookies, requestUrl
            },
            adminforth: this.adminforth,
           });
          if (!resp || (!resp.ok && !resp.error)) {
            throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
          }

          if (resp.error) {
            return { error: resp.error };
          }
        }

        // remove _item from response (might expose sensitive data like backendOnly fields)
        response.items.forEach((item) => {
          delete item._item;
        });
       
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
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            const { allowedActions } = await interpretResource(
              adminUser, resource, { requestBody: body }, ActionCheckSource.CreateRequest, this.adminforth
            );

            const { allowed, error } = checkAccess(AllowedActionsEnum.create, allowedActions);
            if (!allowed) {
              return { error };
            }

            const { record } = body;

            for (const column of resource.columns) {
              if (
                  (column.required as {create?: boolean, edit?: boolean})?.create &&
                  record[column.name] === undefined &&
                  column.showIn.create
              ) {
                  return { error: `Column '${column.name}' is required`, ok: false };
              }
            }

            const response = await this.adminforth.createResourceRecord({ resource, record, adminUser, extra: { body, query, headers, cookies, requestUrl } });
            if (response.error) {
              return { error: response.error, ok: false };
            }
            const connector = this.adminforth.connectors[resource.dataSource];

            return {
              newRecordId: response.createdRecord[connector.getPrimaryKey(resource)],
              ok: true
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/update_record',
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl }) => {
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

            const { allowedActions } = await interpretResource(
              adminUser, 
              resource, 
              { requestBody: body, newRecord: record, oldRecord, pk: recordId }, 
              ActionCheckSource.EditRequest,
              this.adminforth
            );

            const { allowed, error: allowedError } = checkAccess(AllowedActionsEnum.edit, allowedActions);
            if (!allowed) {
              return { error: allowedError };
            }

            const { error } = await this.adminforth.updateResourceRecord({ resource, record, adminUser, oldRecord, recordId, extra: { body, query, headers, cookies, requestUrl} });
            if (error) {
              return { error };
            }
            return {
              ok: true
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/delete_record',
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl }) => {
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

            const { allowedActions } = await interpretResource(
              adminUser, 
              resource, 
              { requestBody: body, record: record }, 
              ActionCheckSource.DeleteRequest,
              this.adminforth
            );

            const { allowed, error } = checkAccess(AllowedActionsEnum.delete, allowedActions);
            if (!allowed) {
              return { error };
            }

            const { error: deleteError } = await this.adminforth.deleteResourceRecord({ resource, record, adminUser, recordId: body['primaryKey'], extra: { body, query, headers, cookies, requestUrl } });
            if (deleteError) {
              return { error: deleteError };
            }
            return {
              ok: true,
              recordId: body['primaryKey']
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/start_bulk_action',
        handler: async ({ body, adminUser, tr }) => {
            const { resourceId, actionId, recordIds } = body;
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
            if (!resource) {
                return { error: await tr(`Resource {resourceId} not found`, 'errors', { resourceId }) };
            }
            const { allowedActions } = await interpretResource(
              adminUser, 
              resource, 
              { requestBody: body },
              ActionCheckSource.BulkActionRequest,
              this.adminforth
            );

            const action = resource.options.bulkActions.find((act) => act.id == actionId);
            if (!action) {
              return { error: await tr(`Action {actionId} not found`, 'errors', { actionId }) };
            } 
            
            if (action.allowed) {
              const execAllowed = await action.allowed({ adminUser, resource, selectedIds: recordIds, allowedActions });
              if (!execAllowed) {
                return { error: await tr(`Action "{actionId}" not allowed`, 'errors', { actionId: action.label }) };
              }
            }
            const response = await action.action({selectedIds: recordIds, adminUser, resource, tr});
            
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