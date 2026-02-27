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
  IAdminForthAndOrFilter,
  BackendOnlyInput,
  Filters,
} from "../types/Back.js";

import { afLogger } from "./logger.js";

import { ADMINFORTH_VERSION, listify, md5hash, getLoginPromptHTML } from './utils.js';

import AdminForthAuth from "../auth.js";
import { ActionCheckSource, AdminForthConfigMenuItem, AdminForthDataTypes, AdminForthFilterOperators, AdminForthResourceColumnInputCommon, AdminForthResourceCommon, AdminForthResourcePages,
   AdminUser, AllowedActionsEnum, AllowedActionsResolved, 
   AnnouncementBadgeResponse,
   GetBaseConfigResponse,
   ShowInResolved} from "../types/Common.js";
import { filtersTools } from "../modules/filtersTools.js";
import is_ip_private from 'private-ip'


async function resolveBoolOrFn(
  val: BackendOnlyInput | undefined,
  ctx: {
    adminUser: AdminUser;
    resource: AdminForthResource;
    meta: any;
    source: ActionCheckSource;
    adminforth: IAdminForth;
  }
): Promise<boolean> {
  if (typeof val === 'function') {
    return !!(await (val)(ctx));
  }
  return !!val;
}

async function isBackendOnly(
  col: AdminForthResource['columns'][number],
  ctx: {
    adminUser: AdminUser;
    resource: AdminForthResource;
    meta: any;
    source: ActionCheckSource;
    adminforth: IAdminForth;
  }
): Promise<boolean> {
  return await resolveBoolOrFn(col.backendOnly, ctx);
}

async function isShown(
  col: AdminForthResource['columns'][number],
  page: 'list' | 'show' | 'edit' | 'create' | 'filter',
  ctx: Parameters<typeof isBackendOnly>[1]
): Promise<boolean> {
  const s = (col.showIn as any) || {};
  if (s[page] !== undefined) return await resolveBoolOrFn(s[page], ctx);
  if (s.all !== undefined) return await resolveBoolOrFn(s.all, ctx);
  return true;
}

async function isFilledOnCreate(  col: AdminForthResource['columns'][number] ): Promise<boolean> {
  const fillOnCreate = !!col.fillOnCreate;
  return fillOnCreate;
}

export async function interpretResource(
  adminUser: AdminUser, 
  resource: AdminForthResource, 
  meta: any, 
  source: ActionCheckSource, 
  adminforth: IAdminForth
): Promise<{allowedActions: AllowedActionsResolved}> {
  afLogger.trace(`🪲Interpreting resource, ${resource.resourceId}, ${source}, 'adminUser', ${adminUser}`);
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
    [ActionCheckSource.CustomActionRequest]: ['show', 'edit', 'delete', 'create', 'filter'],
  }[source];

  await Promise.all(
    Object.entries(resource.options.allowedActions).map(
      async ([key, value]: [string, AllowedActionValue]) => {
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

  async processLoginCallbacks(adminUser: AdminUser, toReturn: { redirectTo?: string, allowedLogin:boolean, error?: string }, response: any, extra: HttpExtra, sessionDuration?: string) {
    const beforeLoginConfirmation = this.adminforth.config.auth.beforeLoginConfirmation as (BeforeLoginConfirmationFunction[] | undefined);

    for (const hook of listify(beforeLoginConfirmation)) {
      const resp = await hook({ 
        adminUser, 
        response,
        adminforth: this.adminforth,
        extra,
        sessionDuration,
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
          afLogger.info(`Adding passwordHashField to userResource, ${userResource}`);
        }

        const userRecord = (
          await this.adminforth.connectors[userResource.dataSource].getData({
            resource: userResource,
            filters: { operator: AdminForthFilterOperators.AND, subFilters: [
              { field: this.adminforth.config.auth.usernameField, operator: AdminForthFilterOperators.EQ, value: username },
            ]},
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

          const expireInDuration = rememberMe 
            ? (this.adminforth.config.auth.rememberMeDuration || '30d')
            : '1d';

          await this.processLoginCallbacks(adminUser, toReturn, response, { 
            body, headers, query, cookies, requestUrl, response
          }, expireInDuration);

          if (toReturn.allowedLogin) {
            
            this.adminforth.auth.setAuthCookie({ 
              expireInDuration,
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
      path: '/get_login_form_config',
      handler: async ({ tr }) => {
        const loginPromptHTML = await getLoginPromptHTML(this.adminforth.config.auth.loginPromptHTML);
        return {
          loginPromptHTML: await tr(loginPromptHTML, 'system.loginPromptHTML'),
        }
      }
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
          removeBackgroundBlendMode: this.adminforth.config.auth.removeBackgroundBlendMode,
          title: this.adminforth.config.customization?.title,
          demoCredentials: this.adminforth.config.auth.demoCredentials,
          loginPageInjections: this.adminforth.config.customization.loginPageInjections,
          globalInjections: {
            everyPageBottom: this.adminforth.config.customization.globalInjections.everyPageBottom,
            sidebarTop: this.adminforth.config.customization.globalInjections.sidebarTop,
          },
          rememberMeDuration: this.adminforth.config.auth.rememberMeDuration,
          singleTheme: this.adminforth.config.customization.singleTheme,
          customHeadItems: this.adminforth.config.customization.customHeadItems,
        };
      },
    });

    server.endpoint({
      method: 'GET',
      path: '/get_base_config',
      handler: async ({input, adminUser, cookies, tr, response}): Promise<GetBaseConfigResponse>=> {
        let username = ''
        let userFullName = ''
    
        // find resource
        if (!this.adminforth.config.auth) {
          throw new Error('No config.auth defined');
        }

        response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');
        response.setHeader('Surrogate-Control', 'no-store');

        const dbUser = adminUser.dbUser;
        username = dbUser[this.adminforth.config.auth.usernameField]; 
        userFullName = dbUser[this.adminforth.config.auth.userFullNameField];
        const userResource = this.adminforth.config.resources.find((res) => res.resourceId === this.adminforth.config.auth.usersResourceId);
        
        const usernameField = this.adminforth.config.auth.usernameField;
        const usernameColumn = userResource.columns.find((col) => col.name === usernameField);

        const userPk = dbUser[userResource.columns.find((col) => col.primaryKey).name];

        const userAvatarUrl = await this.adminforth.config.auth.avatarUrl?.(adminUser);

        const userData = {
            [this.adminforth.config.auth.usernameField]: username,
            [this.adminforth.config.auth.userFullNameField]: userFullName,
            pk: userPk,
            userAvatarUrl: userAvatarUrl || null,
        };
        const checkIsMenuItemVisible = (menuItem) => {
          if (typeof menuItem.visible === 'function') {
            const toReturn = menuItem.visible( adminUser );  // todo better to use  { adminUser } for consistency with allowed actions
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
        
        const settingPages = []
        for ( const settingPage of this.adminforth.config.auth.userMenuSettingsPages || [] ) {
          if ( settingPage.isVisible ) {
            const isVisible = await settingPage.isVisible( adminUser );
            settingPages.push( { ...settingPage, isVisible } );
          }
        }

      let defaultUserExists = false;
        if (username === 'adminforth') {
          defaultUserExists = true;
        }
        
        const publicPart = {
          brandName: this.adminforth.config.customization.brandName,
          usernameFieldName: usernameColumn.label,
          loginBackgroundImage: this.adminforth.config.auth.loginBackgroundImage,
          loginBackgroundPosition: this.adminforth.config.auth.loginBackgroundPosition,
          removeBackgroundBlendMode: this.adminforth.config.auth.removeBackgroundBlendMode,
          title: this.adminforth.config.customization?.title,
          demoCredentials: this.adminforth.config.auth.demoCredentials,
          loginPageInjections: this.adminforth.config.customization.loginPageInjections,
          rememberMeDuration: this.adminforth.config.auth.rememberMeDuration,
          singleTheme: this.adminforth.config.customization.singleTheme,
          customHeadItems: this.adminforth.config.customization.customHeadItems,
        }
        const loggedInPart = {
          showBrandNameInSidebar: this.adminforth.config.customization.showBrandNameInSidebar,
          showBrandLogoInSidebar: this.adminforth.config.customization.showBrandLogoInSidebar,
          brandLogo: this.adminforth.config.customization.brandLogo,
          iconOnlySidebar: this.adminforth.config.customization.iconOnlySidebar,
          datesFormat: this.adminforth.config.customization.datesFormat,
          timeFormat: this.adminforth.config.customization.timeFormat,
          auth: this.adminforth.config.auth,
          usernameField: this.adminforth.config.auth.usernameField,
          title: this.adminforth.config.customization.title,
          emptyFieldPlaceholder: this.adminforth.config.customization.emptyFieldPlaceholder,
          announcementBadge,
          globalInjections: this.adminforth.config.customization.globalInjections,
          userFullnameField: this.adminforth.config.auth.userFullNameField,
          settingPages: settingPages,
          defaultUserExists: defaultUserExists,
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
          if (menuItem.pageLabel) {
            translateRoutines.push(
              (async () => {
                menuItem.pageLabel = await tr(menuItem.pageLabel, `UserMenu.${menuItem.pageLabel}`);
              })()
            );
          }
        }
        newMenu.forEach((menuItem) => {
          processItem(menuItem);
        });
        if( this.adminforth.config.auth.userMenuSettingsPages) {
          this.adminforth.config.auth.userMenuSettingsPages.forEach((page) => {
            processItem(page);
          });
        }
        await Promise.all(translateRoutines);

        // strip all backendOnly fields or not described in adminForth fields from dbUser
        // (when user defines column and does not set backendOnly, we assume it is not backendOnly)
        const ctx = {
          adminUser,
          resource: userResource,
          meta: {},
          source: ActionCheckSource.ShowRequest,
          adminforth: this.adminforth,
        };
        for (const key of Object.keys(adminUser.dbUser)) {
          const col = userResource.columns.find((c) => c.name === key);
          const bo = col ? await isBackendOnly(col, ctx) : true;
          if (!col || bo) {
            delete adminUser.dbUser[key];
          }
        }

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

        if (resource.options.fieldGroups) {
          resource.options.fieldGroups.forEach((group, i) => {
            if (group.groupName) {
              translateRoutines[`fieldGroup${i}`] = tr(group.groupName, `resource.${resource.resourceId}.fieldGroup`);
            }
          });
        }

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
                  async (inCol, i) => {
                    const col = JSON.parse(JSON.stringify(inCol));
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
                      Object.entries(inCol.showIn).map(
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
                      col.editingNote.create = await tr(col.editingNote.create, `resource.${resource.resourceId}.editingNote`);
                    }
                    if (col.editingNote?.edit) {
                      col.editingNote.edit = await tr(col.editingNote.edit, `resource.${resource.resourceId}.editingNote`);
                    }
                    if (col.foreignResource?.unsetLabel) {
                      col.foreignResource.unsetLabel = await tr(col.foreignResource.unsetLabel, `resource.${resource.resourceId}.foreignResource.unsetLabel`);
                    }
                    if (inCol.suggestOnCreate && typeof inCol.suggestOnCreate === 'function') {
                      col.suggestOnCreate = await inCol.suggestOnCreate(adminUser);
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
              fieldGroups: resource.options.fieldGroups?.map((group, i) => ({
                ...group,
                noTitle: group.noTitle ?? false,
                groupName: translated[`fieldGroup${i}`] || group.groupName,
              })),
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
          const filterTools = filtersTools.get(body);
          body.filtersTools = filterTools;
          const resp = await hook({
            resource,
            query: body,
            adminUser,
            filtersTools: filterTools, 
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

        // remove virtual fields from sort if still presented after beforeDatasourceRequest hook
        const sortFiltered = sort.filter((sortItem: IAdminForthSort) => {
          return !resource.columns.find((col) => col.name === sortItem.field && col.virtual);
        });

        // after beforeDatasourceRequest hook, filter can be anything
        // so, we need to turn it into AndOr filter
        // (validation and normalization of individual filters will be done inside getData)
        const normalizedFilters = { operator: AdminForthFilterOperators.AND, subFilters: [] };
        if (filters) {
          if (typeof filters !== 'object') {
            throw new Error(`Filter should be an array or an object`);
          }
          if (Array.isArray(filters)) {
            // if filters are an array, they will be connected with "AND" operator by default
            normalizedFilters.subFilters = filters;
          } else if (filters.field) {
            // assume filter is a SingleFilter
            normalizedFilters.subFilters = [filters];
          } else if (filters.subFilters) {
            // assume filter is a AndOr filter
            normalizedFilters.operator = filters.operator;
            normalizedFilters.subFilters = filters.subFilters;
          } else {
            // wrong filter
            throw new Error(`Wrong filter object value: ${JSON.stringify(filters)}`);
          }
        }

        const data = await this.adminforth.connectors[resource.dataSource].getData({
          resource,
          limit,
          offset,
          filters: normalizedFilters as IAdminForthAndOrFilter,
          sort: sortFiltered,
          getTotals: source === 'list',
        });

        // for foreign keys, add references
        await Promise.all(
          resource.columns.filter((col) => col.foreignResource).map(async (col) => {
            let targetDataMap = {};

            if (col.foreignResource.resourceId) {
              const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == col.foreignResource.resourceId);
              const targetConnector = this.adminforth.connectors[targetResource.dataSource];
              const targetResourcePkField = targetResource.columns.find((col) => col.primaryKey).name;
              const pksUnique = [...new Set(data.data.reduce((pks, item) => {
                if (col.isArray?.enabled) {
                  if (item[col.name]?.length) {
                    pks = pks.concat(item[col.name]);
                  }
                } else {
                  pks.push(item[col.name]);
                }
                return pks;
              }, []))];
              if (pksUnique.length === 0) {
                return;
              }
              const targetData = await targetConnector.getData({
                resource: targetResource,
                limit: pksUnique.length,
                offset: 0,
                filters: { operator: AdminForthFilterOperators.AND, subFilters: [
                  {
                    field: targetResourcePkField,
                    operator: AdminForthFilterOperators.IN,
                    value: pksUnique,
                  }
                ]},
                sort: [],
              });
              targetDataMap = targetData.data.reduce((acc, item) => {
                acc[item[targetResourcePkField]] = {
                  label: targetResource.recordLabel(item),
                  pk: item[targetResourcePkField],
                }
                return acc;
              }, {});
            } else {
              const targetResources = {};
              const targetConnectors = {};
              const targetResourcePkFields = {};
              const pksUniques = {};
              col.foreignResource.polymorphicResources.forEach((pr) => {
                if (pr.resourceId === null) {
                  return;
                }
                const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == pr.resourceId);
                if (!targetResource) {
                  return;
                }
                targetResources[pr.whenValue] = targetResource;
                targetConnectors[pr.whenValue] = this.adminforth.connectors[targetResources[pr.whenValue].dataSource];
                targetResourcePkFields[pr.whenValue] = targetResources[pr.whenValue].columns.find((col) => col.primaryKey).name;
                const pksUnique = [...new Set(data.data.filter((item) => item[col.foreignResource.polymorphicOn] === pr.whenValue).map((item) => item[col.name]))];
                if (pksUnique.length !== 0) {
                  pksUniques[pr.whenValue] = pksUnique;
                }
                if (Object.keys(pksUniques).length === 0) {
                  return;
                }
              });

              const targetData = (await Promise.all(Object.keys(pksUniques).map((polymorphicOnValue) =>
                targetConnectors[polymorphicOnValue].getData({
                  resource: targetResources[polymorphicOnValue],
                  limit: limit,
                  offset: 0,
                  filters: { operator: AdminForthFilterOperators.AND, subFilters: [
                    {
                      field: targetResourcePkFields[polymorphicOnValue],
                      operator: AdminForthFilterOperators.IN,
                      value: pksUniques[polymorphicOnValue],
                    }
                  ]},
                  sort: [],
                })
              ))).reduce((acc: any, td: any, tdi) => ({
                ...acc,
                [Object.keys(pksUniques)[tdi]]: td,
              }), {});
              targetDataMap = Object.keys(targetData).reduce((tdAcc, polymorphicOnValue) => ({
                ...tdAcc,
                ...targetData[polymorphicOnValue].data.reduce((dAcc, item) => {
                  dAcc[item[targetResourcePkFields[polymorphicOnValue]]] = {
                    label: targetResources[polymorphicOnValue].recordLabel(item),
                    pk: item[targetResourcePkFields[polymorphicOnValue]],
                  }
                  return dAcc;
                }, {}),
              }), {});
            }
            
            data.data.forEach((item) => {
              // item[col.name] = targetDataMap[item[col.name]];, commented by @Vitalii
              if (col.isArray?.enabled) {
                if (item[col.name]?.length) {
                  item[col.name] = item[col.name].map((i) => targetDataMap[i]);
                }
              } else {
                item[col.name] = targetDataMap[item[col.name]];
              }
            });
          })
        );

        const pkField = resource.columns.find((col) => col.primaryKey)?.name;
        // remove all columns which are not defined in resources, or defined but backendOnly
        {
          const ctx = {
            adminUser,
            resource,
            meta,
            source: {
              show: ActionCheckSource.ShowRequest,
              list: ActionCheckSource.ListRequest,
              edit: ActionCheckSource.EditLoadRequest,
            }[source],
            adminforth: this.adminforth,
          };
        
          for (const item of data.data) {
            for (const key of Object.keys(item)) {
              const col = resource.columns.find((c) => c.name === key);
              const bo = col ? await isBackendOnly(col, ctx) : true;
              if (!col || bo) {
                delete item[key];
              }
            }
            item._label = resource.recordLabel(item);
          }
        }
        if (source === 'list' && resource.options.listTableClickUrl) {
          await Promise.all(
            data.data.map(async (item) => {
                item._clickUrl = await resource.options.listTableClickUrl(item, adminUser, resource);
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
        const { resourceId, column, search } = body;
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

        const targetResourceIds = columnConfig.foreignResource.resourceId ? [columnConfig.foreignResource.resourceId] : columnConfig.foreignResource.polymorphicResources.filter(pr => pr.resourceId !== null).map((pr) => pr.resourceId);
        const targetResources = targetResourceIds.map((trId) => this.adminforth.config.resources.find((res) => res.resourceId == trId));

        const responses = (await Promise.all(
          targetResources.map(async (targetResource) => {
            return new Promise(async (resolve) => {
              for (const hook of listify(columnConfig.foreignResource.hooks?.dropdownList?.beforeDatasourceRequest as BeforeDataSourceRequestFunction[])) {
                const filterTools = filtersTools.get(body);
                body.filtersTools = filterTools;
                const resp = await hook({
                  query: body,
                  adminUser,
                  filtersTools: filterTools, 
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

              // after beforeDatasourceRequest hook, filter can be anything
              // so, we need to turn it into AndOr filter
              // (validation and normalization of individual filters will be done inside getData)
              const normalizedFilters = { operator: AdminForthFilterOperators.AND, subFilters: [] };
              if (filters) {
                if (typeof filters !== 'object') {
                  throw new Error(`Filter should be an array or an object`);
                }
                if (Array.isArray(filters)) {
                  // if filters are an array, they will be connected with "AND" operator by default
                  normalizedFilters.subFilters = filters;
                } else if (filters.field) {
                  // assume filter is a SingleFilter
                  normalizedFilters.subFilters = [filters];
                } else if (filters.subFilters) {
                  // assume filter is a AndOr filter
                  normalizedFilters.operator = filters.operator;
                  normalizedFilters.subFilters = filters.subFilters;
                } else {
                  // wrong filter
                  throw new Error(`Wrong filter object value: ${JSON.stringify(filters)}`);
                }
              }

              if (search && search.trim() && columnConfig.foreignResource.searchableFields) {
                const searchableFields = Array.isArray(columnConfig.foreignResource.searchableFields) 
                  ? columnConfig.foreignResource.searchableFields 
                  : [columnConfig.foreignResource.searchableFields];

                const searchOperator = columnConfig.foreignResource.searchIsCaseSensitive 
                  ? AdminForthFilterOperators.LIKE 
                  : AdminForthFilterOperators.ILIKE;
                const availableSearchFields = searchableFields.filter((fieldName) => {
                  const fieldExists = targetResource.columns.some(col => col.name === fieldName);
                  if (!fieldExists) {
                    afLogger.trace(`⚠️  Field '${fieldName}' not found in polymorphic target resource '${targetResource.resourceId}', skipping in search filter.`);
                  }
                  return fieldExists;
                });

                if (availableSearchFields.length === 0) {
                  afLogger.trace(`⚠️  No searchable fields available in polymorphic target resource '${targetResource.resourceId}', skipping resource.`);
                  resolve({ items: [] });
                  return;
                }
                const searchFilters = availableSearchFields.map((fieldName) => {
                  const filter = {
                  field: fieldName,
                  operator: searchOperator,
                  value: search.trim(),
                  };
                  return filter;
                });

                if (searchFilters.length > 1) {
                  normalizedFilters.subFilters.push({
                    operator: AdminForthFilterOperators.OR,
                    subFilters: searchFilters,
                  });
                } else if (searchFilters.length === 1) {
                  normalizedFilters.subFilters.push(searchFilters[0]);
                }
              }
              const dbDataItems = await this.adminforth.connectors[targetResource.dataSource].getData({
                resource: targetResource,
                limit,
                offset,
                filters: normalizedFilters as IAdminForthAndOrFilter,
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

              resolve(response);
            });
          })
        )).reduce((acc: any, response: any) => {
          return [...acc, ...response.items];
        }, []);

        return { items: responses };
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
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl, response }) => {
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

            const { record, requiredColumnsToSkip } = body;

            // todo if showIn.create is function, code below will be buggy (will not detect required fact)
            for (const column of resource.columns) {
              if (
                  (column.required as {create?: boolean, edit?: boolean})?.create &&
                  record[column.name] === undefined &&
                  column.showIn.create
              ) {
                  const shouldWeSkipColumn = requiredColumnsToSkip.find(reqColumnToSkip => reqColumnToSkip.name === column.name);
                  if (!shouldWeSkipColumn) {
                    return { error: `Column '${column.name}' is required`, ok: false };
                  }
              }
            }

            const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
            if (record[primaryKeyColumn.name] !== undefined) {
              const existingRecord = await this.adminforth.resource(resource.resourceId).get([Filters.EQ(primaryKeyColumn.name, record[primaryKeyColumn.name])]);
              if (existingRecord) {
                return { error: `Record with ${primaryKeyColumn.name} '${record[primaryKeyColumn.name]}' already exists`, ok: false };
              }
            }

            const ctxCreate = {
              adminUser,
              resource,
              meta: { requestBody: body },
              source: ActionCheckSource.CreateRequest,
              adminforth: this.adminforth,
            };

            for (const column of resource.columns) {
              if ((column.required as { create?: boolean })?.create) {
                const shown = await isShown(column, 'create', ctxCreate);
                const shouldWeSkipColumn = requiredColumnsToSkip.find(reqColumnToSkip => reqColumnToSkip.name === column.name);
                if (!shouldWeSkipColumn) {
                  if (shown && record[column.name] === undefined) {
                    return { error: `Column '${column.name}' is required`, ok: false };
                  }
                }
              }
            }

            for (const column of resource.columns) {
              const fieldName = column.name;
              if (fieldName in record) {
                const shown = await isShown(column, 'create', ctxCreate); //
                const bo = await isBackendOnly(column, ctxCreate);
                const filledOnCreate = await isFilledOnCreate(column);
                if (bo) {
                  return {
                    error: `Field "${fieldName}" cannot be modified as it is restricted from creation (backendOnly is true).`,
                    ok: false,
                  };
                }

                if (!shown && !filledOnCreate && !column.allowModifyWhenNotShowInCreate) {
                  return {
                    error: `Field "${fieldName}" cannot be modified as it is restricted from creation (showIn.create is false). If you need to set this hidden field during creation, either configure column.fillOnCreate or set column.allowModifyWhenNotShowInCreate = true.`,
                    ok: false,
                  };
                }
              }
            }
          
            // for polymorphic foreign resources, we need to find out the value for polymorphicOn column
            for (const column of resource.columns) {
              if (column.foreignResource?.polymorphicOn && record[column.name] === null) {
                const systemResource = column.foreignResource.polymorphicResources.find(pr => pr.resourceId === null);
                record[column.foreignResource.polymorphicOn] = systemResource.whenValue;
              } else if (column.foreignResource?.polymorphicOn && record[column.name]) {
                const targetResources = {};
                const targetConnectors = {};
                const targetResourcePkFields = {};
                column.foreignResource.polymorphicResources.forEach((pr) => {
                  if (pr.resourceId === null) {
                    return;
                  }
                  const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == pr.resourceId);
                  if (!targetResource) {
                    return;
                  }
                  targetResources[pr.whenValue] = targetResource;
                  targetConnectors[pr.whenValue] = this.adminforth.connectors[targetResources[pr.whenValue].dataSource];
                  targetResourcePkFields[pr.whenValue] = targetResources[pr.whenValue].columns.find((col) => col.primaryKey).name;
                });

                const targetData = (await Promise.all(Object.keys(targetResources).map((polymorphicOnValue) =>
                  targetConnectors[polymorphicOnValue].getData({
                    resource: targetResources[polymorphicOnValue],
                    limit: 1,
                    offset: 0,
                    filters: { operator: AdminForthFilterOperators.AND, subFilters: [
                      {
                        field: targetResourcePkFields[polymorphicOnValue],
                        operator: AdminForthFilterOperators.EQ,
                        value: record[column.name],
                      }
                    ]},
                    sort: [],
                  })
                ))).reduce((acc: any, td: any, tdi) => ({
                  ...acc,
                  [Object.keys(targetResources)[tdi]]: td.data,
                }), {});
                record[column.foreignResource.polymorphicOn] = Object.keys(targetData).find((tdk) => targetData[tdk].length);
              }
            }

            const createRecordResponse = await this.adminforth.createResourceRecord({ 
              resource, record, adminUser, response, 
              extra: { body, query, headers, cookies, requestUrl, response } 
            });
            if (createRecordResponse.error) {
              return { 
                error: createRecordResponse.error, 
                ok: false, 
                newRecordId: createRecordResponse.redirectToRecordId ? createRecordResponse.redirectToRecordId :createRecordResponse.newRecordId, 
                redirectToRecordId: createRecordResponse.redirectToRecordId 
              };
            }
            const connector = this.adminforth.connectors[resource.dataSource];

            return {
              newRecordId: createRecordResponse.createdRecord[connector.getPrimaryKey(resource)],
              redirectToRecordId: createRecordResponse.createdRecord[connector.getPrimaryKey(resource)],
              ok: true
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/update_record',
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl, response }) => {
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

            const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
            if (record[primaryKeyColumn.name] !== undefined) {
              const existingRecord = await this.adminforth.resource(resource.resourceId).get([Filters.EQ(primaryKeyColumn.name, record[primaryKeyColumn.name])]);
              if (existingRecord) {
                return { error: `Record with ${primaryKeyColumn.name} '${record[primaryKeyColumn.name]}' already exists`, ok: false };
              }
            }

            const ctxEdit = {
              adminUser,
              resource,
              meta: { requestBody: body, newRecord: record, oldRecord, pk: recordId },
              source: ActionCheckSource.EditRequest,
              adminforth: this.adminforth,
            };
            
            for (const column of resource.columns) {
              const fieldName = column.name;
              if (fieldName in record) {
                const shown = await isShown(column, 'edit', ctxEdit);
                const bo = await isBackendOnly(column, ctxEdit);
                if (bo) {
                  return {
                    error: `Field "${fieldName}" cannot be modified as it is restricted from editing (backendOnly is true).`,
                    ok: false,
                  };
                }

                if (column.editReadonly) {
                  return {
                    error: `Field "${fieldName}" cannot be modified as it is restricted from editing (editReadonly is true).`,
                    ok: false,
                  };
                }

                if (!shown && !column.allowModifyWhenNotShowInEdit) {
                  return {
                    error: `Field "${fieldName}" cannot be modified as it is restricted from editing (showIn.edit is false). If you need to allow updating this hidden field during editing, set column.allowModifyWhenNotShowInEdit = true.`,
                    ok: false,
                  };
                }
              }
            }
            // for polymorphic foreign resources, we need to find out the value for polymorphicOn column
            for (const column of resource.columns) {
              if (column.foreignResource?.polymorphicOn && record[column.name] === null) {
                const systemResource = column.foreignResource.polymorphicResources.find(pr => pr.resourceId === null);
                record[column.foreignResource.polymorphicOn] = systemResource.whenValue;
              } else if (column.foreignResource?.polymorphicOn && record[column.name]) {
                let newPolymorphicOnValue = null;
                if (record[column.name]) {
                  const targetResources = {};
                  const targetConnectors = {};
                  const targetResourcePkFields = {};
                  column.foreignResource.polymorphicResources.forEach((pr) => {
                    if (pr.resourceId === null) {
                      return;
                    }
                    const targetResource = this.adminforth.config.resources.find((res) => res.resourceId == pr.resourceId);
                    if (!targetResource) {
                      return;
                    }
                    targetResources[pr.whenValue] = targetResource;
                    targetConnectors[pr.whenValue] = this.adminforth.connectors[targetResources[pr.whenValue].dataSource];
                    targetResourcePkFields[pr.whenValue] = targetResources[pr.whenValue].columns.find((col) => col.primaryKey).name;
                  });

                  const targetData = (await Promise.all(Object.keys(targetResources).map((polymorphicOnValue) =>
                    targetConnectors[polymorphicOnValue].getData({
                      resource: targetResources[polymorphicOnValue],
                      limit: 1,
                      offset: 0,
                      filters: { operator: AdminForthFilterOperators.AND, subFilters: [
                        {
                          field: targetResourcePkFields[polymorphicOnValue],
                          operator: AdminForthFilterOperators.EQ,
                          value: record[column.name],
                        }
                      ]},
                      sort: [],
                    })
                  ))).reduce((acc: any, td: any, tdi) => ({
                    ...acc,
                    [Object.keys(targetResources)[tdi]]: td.data,
                  }), {});
                  newPolymorphicOnValue = Object.keys(targetData).find((tdk) => targetData[tdk].length);
                }
                
                if (oldRecord[column.foreignResource.polymorphicOn] !== newPolymorphicOnValue) {
                  record[column.foreignResource.polymorphicOn] = newPolymorphicOnValue;
                }
              }
            }
            
            const { error } = await this.adminforth.updateResourceRecord({ 
              resource, updates: record, adminUser, oldRecord, recordId, response, 
              extra: { body, query, headers, cookies, requestUrl, response } 
            });
            if (error) {
              return { error };
            }
            return {
              recordId: record.id,
              ok: true
            }
        }
    });
    server.endpoint({
        method: 'POST',
        path: '/delete_record',
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl, response }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            const record = await this.adminforth.connectors[resource.dataSource].getRecordByPrimaryKey(resource, body['primaryKey']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            if (!record){
                return { error: `Record with ${body['primaryKey']} not found` };
            }
            if (!resource.options.allowedActions.delete) {
                return { error: `Resource '${resource.resourceId}' does not allow delete action` };
            } 
            const childResources = this.adminforth.config.resources.filter(r => r.columns.some(c => c.foreignResource?.resourceId === resource.resourceId)); 
            if (childResources.length){
              for (const childRes of childResources) {
                const foreignResourceColumn = childRes.columns.find(c => c.foreignResource?.resourceId === resource.resourceId);
                if (!foreignResourceColumn.foreignResource.onDelete) continue;
                const onDeleteStrategy = foreignResourceColumn.foreignResource.onDelete;    
                const childRecords = await this.adminforth.resource(childRes.resourceId).list(Filters.EQ(foreignResourceColumn.name, body['primaryKey']))
                if (onDeleteStrategy === 'cascade') {
                  for (const childRecord of childRecords) {
                    await this.adminforth.resource(childRes.resourceId).delete(childRecord.id);
                  }
                } else if (onDeleteStrategy === 'setNull') {
                  for (const childRecord of childRecords) {
                    await this.adminforth.resource(childRes.resourceId).update(childRecord.id, {[foreignResourceColumn.name]: null});
                  }
                } else {
                  return { error: `Wrong onDelete strategy: ${onDeleteStrategy}` };
                }
              }
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

            const { error: deleteError } = await this.adminforth.deleteResourceRecord({ 
              resource, record, adminUser, recordId: body['primaryKey'], response, 
              extra: { body, query, headers, cookies, requestUrl, response } 
            });
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
        handler: async ({ body, adminUser, tr, response }) => {
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
            const bulkActionResponse = await action.action({selectedIds: recordIds, adminUser, resource, response, tr});
            
            return {
              actionId,
              recordIds,
              resourceId,
              ...bulkActionResponse
            }
        }
    })

    server.endpoint({
      method: 'POST',
      path: '/start_custom_action',
      handler: async ({ body, adminUser, tr, cookies, response, headers }) => {
        const { resourceId, actionId, recordId, extra } = body;
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: await tr(`Resource {resourceId} not found`, 'errors', { resourceId }) };
        }
        const { allowedActions } = await interpretResource(
          adminUser, 
          resource, 
          { requestBody: body },
          ActionCheckSource.CustomActionRequest,
          this.adminforth
        );
        const action = resource.options.actions.find((act) => act.id == actionId);
        if (!action) {
          return { error: await tr(`Action {actionId} not found`, 'errors', { actionId }) };
        }
        if (action.allowed) {
          const execAllowed = await action.allowed({ adminUser, standardAllowedActions: allowedActions });
          if (!execAllowed) {
            return { error: await tr(`Action "{actionId}" not allowed`, 'errors', { actionId: action.name }) };
          }
        }

        if (action.url) {
          return {
            actionId,
            recordId,
            resourceId,
            redirectUrl: action.url
          }
        }

        const actionResponse = await action.action({ recordId, adminUser, resource, tr, adminforth: this.adminforth, response, extra: {...extra, cookies: cookies, headers: headers} });
        
        return {
          actionId,
          recordId,
          resourceId,
          ...actionResponse
        }
      }
    });

    // setup endpoints for all plugins
    this.adminforth.activatedPlugins.forEach((plugin) => {
      plugin.setupEndpoints(server);
    });
    
  }
}
