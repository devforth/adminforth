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
import type { AnySchemaObject } from 'ajv';

import {cascadeChildrenDelete} from './utils.js'

import { afLogger } from "./logger.js";

import { ADMINFORTH_VERSION, listify, md5hash, getLoginPromptHTML, hookResponseError } from './utils.js';

import AdminForthAuth from "../auth.js";
import { ActionCheckSource, AdminForthActionFront, AdminForthConfigMenuItem, AdminForthDataTypes, AdminForthFilterOperators, AdminForthResourceColumnInputCommon, AdminForthResourceFrontend, AdminForthResourcePages,
  AdminForthSortDirections,
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

function stripResourceColumnFrontendMeta(column: Record<string, any>) {
  const { default: _default, _baseTypeDebug, ...sanitizedColumn } = column;
  return sanitizedColumn;
}

const SIMPLE_FILTER_OPERATORS = Object.values(AdminForthFilterOperators).filter((operator) => {
  return operator !== AdminForthFilterOperators.AND && operator !== AdminForthFilterOperators.OR;
});

const genericObjectSchema: AnySchemaObject = {
  type: 'object',
  additionalProperties: true,
};

const errorResponseSchema: AnySchemaObject = {
  title: 'AdminForthErrorResponse',
  description: 'Standard error response returned by AdminForth endpoints.',
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
  additionalProperties: true,
};

const recordIdentifierSchema: AnySchemaObject = {
  title: 'AdminForthRecordIdentifier',
  description: 'Record identifier accepted by AdminForth. Depending on the resource it can be a string or a number.',
  anyOf: [
    { type: 'string' },
    { type: 'number' },
  ],
};

const actionIdentifierSchema: AnySchemaObject = {
  title: 'AdminForthActionIdentifier',
  description: 'Action identifier accepted by AdminForth. Depending on configuration it can be a string or a number.',
  anyOf: [
    { type: 'string' },
    { type: 'number' },
  ],
};

const namedColumnSchema: AnySchemaObject = {
  title: 'AdminForthNamedColumn',
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
  additionalProperties: true,
};

const validationResultSchema: AnySchemaObject = {
  title: 'AdminForthValidationResult',
  type: 'object',
  required: ['isValid'],
  properties: {
    isValid: { type: 'boolean' },
    message: { type: 'string' },
  },
  additionalProperties: true,
};

const filterConditionExample = {
  field: 'status',
  operator: AdminForthFilterOperators.EQ,
  value: 'active',
};

const filterGroupExample = {
  operator: AdminForthFilterOperators.AND,
  subFilters: [filterConditionExample],
};

const sortItemExample = {
  field: 'createdAt',
  direction: AdminForthSortDirections.desc,
};

const filterConditionSchema: AnySchemaObject = {
  title: 'AdminForthFilterCondition',
  description: 'Single field comparison used in AdminForth filtering.',
  type: 'object',
  properties: {
    field: { type: 'string' },
    operator: { type: 'string', enum: SIMPLE_FILTER_OPERATORS },
    value: {},
    rightField: { type: 'string' },
    insecureRawSQL: { type: 'string' },
    insecureRawNoSQL: {},
  },
  additionalProperties: true,
  examples: [filterConditionExample],
};

const filterGroupSchema: AnySchemaObject = {
  title: 'AdminForthFilterGroup',
  description: 'Nested boolean filter group. Use this for AND or OR combinations of filter nodes.',
  type: 'object',
  required: ['operator', 'subFilters'],
  properties: {
    operator: {
      type: 'string',
      enum: [AdminForthFilterOperators.AND, AdminForthFilterOperators.OR],
    },
    subFilters: {
      type: 'array',
      items: { $ref: '#/$defs/filterNode' },
      description: 'Nested filters evaluated with the selected operator.',
    },
  },
  additionalProperties: true,
  examples: [filterGroupExample],
};

const sortItemSchema: AnySchemaObject = {
  title: 'AdminForthSortItem',
  description: 'Single sort instruction applied in order with the rest of the list.',
  type: 'object',
  required: ['field', 'direction'],
  properties: {
    field: { type: 'string' },
    direction: { type: 'string', enum: Object.values(AdminForthSortDirections) },
  },
  additionalProperties: true,
  examples: [sortItemExample],
};

const commonFilterSchemaDefs: Record<string, AnySchemaObject> = {
  singleFilter: filterConditionSchema,
  filterGroup: filterGroupSchema,
  filterNode: {
    title: 'AdminForthFilterNode',
    description: 'Either a single filter condition or a nested filter group.',
    anyOf: [
      { $ref: '#/$defs/singleFilter' },
      { $ref: '#/$defs/filterGroup' },
    ],
    examples: [filterConditionExample, filterGroupExample],
  },
  sortItem: sortItemSchema,
};

const commonSortSchema: AnySchemaObject = {
  title: 'AdminForthSortList',
  description: 'Ordered list of sort instructions.',
  type: 'array',
  items: { $ref: '#/$defs/sortItem' },
  examples: [[sortItemExample]],
};

const commonFiltersSchema: AnySchemaObject = {
  title: 'AdminForthFilterInput',
  description: 'Runtime accepts either a single filter node or an array of filter nodes. The OpenAPI document normalizes this to the array form for readability.',
  oneOf: [
    {
      type: 'array',
      items: { $ref: '#/$defs/filterNode' },
    },
    { $ref: '#/$defs/filterNode' },
  ],
};

function createErrorOrSuccessSchema(successSchema: AnySchemaObject): AnySchemaObject {
  return {
    anyOf: [
      errorResponseSchema,
      successSchema,
    ],
  };
}

const getResourceDataRequestSchema: AnySchemaObject = {
  type: 'object',
  $defs: commonFilterSchemaDefs,
  required: ['resourceId', 'source', 'limit', 'offset', 'filters', 'sort'],
  properties: {
    resourceId: { type: 'string' },
    source: {
      type: 'string',
      enum: ['show', 'list', 'edit'],
      description: 'Target UI context. Show and edit requests should use direct field filters that identify a single record.',
    },
    limit: {
      type: 'integer',
      description: 'Maximum number of rows to return for the current page.',
    },
    offset: {
      type: 'integer',
      description: 'Zero-based row offset used for pagination.',
    },
    sort: commonSortSchema,
    filters: commonFiltersSchema,
  },
  additionalProperties: true,
  allOf: [
    {
      if: {
        properties: {
          source: { enum: ['show', 'edit'] },
        },
        required: ['source'],
      },
      then: {
        properties: {
          filters: {
            type: 'array',
            items: {
              allOf: [
                { $ref: '#/$defs/singleFilter' },
                {
                  type: 'object',
                  required: ['field'],
                },
              ],
            },
          },
        },
      },
    },
  ],
};

const getResourceDataResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'array',
      items: genericObjectSchema,
    },
    total: { type: 'number' },
    options: genericObjectSchema,
  },
  additionalProperties: true,
});

const getMenuBadgesResponseSchema: AnySchemaObject = {
  type: 'object',
  additionalProperties: {
    anyOf: [
      { type: 'string' },
      { type: 'number' },
    ],
  },
};

const getResourceRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId'],
  properties: {
    resourceId: { type: 'string' },
  },
  additionalProperties: true,
};

const getResourceResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['resource'],
  properties: {
    resource: genericObjectSchema,
  },
  additionalProperties: true,
});

const getResourceForeignDataRequestSchema: AnySchemaObject = {
  type: 'object',
  $defs: commonFilterSchemaDefs,
  required: ['resourceId', 'column', 'limit', 'offset'],
  properties: {
    resourceId: { type: 'string' },
    column: { type: 'string' },
    limit: {
      type: 'integer',
      description: 'Maximum number of dropdown options to return.',
    },
    offset: {
      type: 'integer',
      description: 'Zero-based offset used to fetch the next option page.',
    },
    search: { type: 'string' },
    filters: commonFiltersSchema,
    sort: commonSortSchema,
    currentValue: {
      description: 'When set, guarantees this PK value appears in the returned items even if it falls outside the requested page.',
    },
  },
  additionalProperties: true,
};

const getResourceForeignDataResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['value', 'label'],
        properties: {
          value: {},
          label: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
});

const getMinMaxForColumnsRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId'],
  properties: {
    resourceId: { type: 'string' },
  },
  additionalProperties: true,
};

const getMinMaxForColumnsResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  additionalProperties: {
    type: 'object',
    required: ['min', 'max'],
    properties: {
      min: {},
      max: {},
    },
    additionalProperties: true,
  },
});

const createRecordRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'record', 'requiredColumnsToSkip'],
  properties: {
    resourceId: { type: 'string' },
    record: genericObjectSchema,
    requiredColumnsToSkip: {
      type: 'array',
      items: namedColumnSchema,
    },
    meta: genericObjectSchema,
  },
  additionalProperties: true,
};

const createRecordResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['ok', 'newRecordId', 'redirectToRecordId'],
  properties: {
    ok: { const: true },
    newRecordId: recordIdentifierSchema,
    redirectToRecordId: recordIdentifierSchema,
  },
  additionalProperties: true,
});

const updateRecordRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'recordId', 'record'],
  properties: {
    resourceId: { type: 'string' },
    recordId: recordIdentifierSchema,
    record: genericObjectSchema,
    meta: genericObjectSchema,
  },
  additionalProperties: true,
};

const updateRecordResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['ok'],
  properties: {
    ok: { const: true },
    recordId: recordIdentifierSchema,
  },
  additionalProperties: true,
});

const deleteRecordRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'primaryKey'],
  properties: {
    resourceId: { type: 'string' },
    primaryKey: recordIdentifierSchema,
  },
  additionalProperties: true,
};

const deleteRecordResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['ok', 'recordId'],
  properties: {
    ok: { const: true },
    recordId: recordIdentifierSchema,
  },
  additionalProperties: true,
});

const startCustomActionRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'actionId', 'recordId'],
  properties: {
    resourceId: { type: 'string' },
    actionId: actionIdentifierSchema,
    recordId: recordIdentifierSchema,
    extra: genericObjectSchema,
  },
  additionalProperties: true,
};

const startCustomActionResponseSchema: AnySchemaObject = {
  anyOf: [
    errorResponseSchema,
    {
      type: 'object',
      required: ['actionId', 'resourceId', 'recordId', 'redirectUrl'],
      properties: {
        actionId: actionIdentifierSchema,
        resourceId: { type: 'string' },
        recordId: recordIdentifierSchema,
        redirectUrl: { type: 'string' },
      },
      additionalProperties: true,
    },
    {
      type: 'object',
      required: ['actionId', 'resourceId', 'recordId', 'ok'],
      properties: {
        actionId: actionIdentifierSchema,
        resourceId: { type: 'string' },
        recordId: recordIdentifierSchema,
        ok: { const: true },
      },
      additionalProperties: true,
    },
  ],
};

const startCustomBulkActionRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'actionId', 'recordIds'],
  properties: {
    resourceId: { type: 'string' },
    actionId: actionIdentifierSchema,
    recordIds: {
      type: 'array',
      items: recordIdentifierSchema,
    },
    extra: genericObjectSchema,
  },
  additionalProperties: true,
};

const startCustomBulkActionResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['actionId', 'resourceId', 'recordIds', 'ok'],
  properties: {
    actionId: actionIdentifierSchema,
    resourceId: { type: 'string' },
    recordIds: {
      type: 'array',
      items: recordIdentifierSchema,
    },
    ok: { const: true },
  },
  additionalProperties: true,
});

const validateColumnsRequestSchema: AnySchemaObject = {
  type: 'object',
  required: ['resourceId', 'editableColumns', 'record'],
  properties: {
    resourceId: { type: 'string' },
    editableColumns: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          value: {},
        },
        additionalProperties: true,
      },
    },
    record: genericObjectSchema,
  },
  additionalProperties: true,
};

const validateColumnsResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
  type: 'object',
  required: ['validationResults'],
  properties: {
    validationResults: {
      type: 'object',
      additionalProperties: validationResultSchema,
    },
  },
  additionalProperties: true,
});

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

  checkAbortSignal(abortSignal: AbortSignal): boolean {
    if (abortSignal.aborted) {
      return true;
    }
    return false;
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
          loginPromptHTML: loginPromptHTML ? await tr(loginPromptHTML, 'system.loginPromptHTML') : null,
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
      handler: async ({ adminUser, cookies, tr, response }): Promise<GetBaseConfigResponse>=> {
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
      description: 'Computes the current menu badge values for the authenticated admin user. Static badges are returned directly, and dynamic badge callbacks are resolved for all configured menu items, including nested items.',
      response_schema: getMenuBadgesResponseSchema,
      handler: async ({ adminUser }) => {
        const badges = {};

        const badgeFunctions = [];

        const adminforth = this.adminforth;

        function processMenuItem(menuItem) {
          if (menuItem.badge) {
            if (typeof menuItem.badge === 'function') {
              badgeFunctions.push(async () => {
                badges[menuItem.itemId] = await menuItem.badge(adminUser, adminforth);
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
      description: 'Returns the definition of a single resource. The response includes translated labels, column metadata, allowed actions, visible bulk actions, frontend action metadata, and resource options after permission checks and removal of backend-only internals.',
      request_schema: getResourceRequestSchema,
      response_schema: getResourceResponseSchema,
      handler: async ({ body, adminUser, tr }): Promise<{ resource?: AdminForthResourceFrontend, error?: string }> => {
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

        const allowedCustomActions: Array<(typeof resource.options.actions)[number] & { allowed: boolean }> = [];
        if (resource.options.actions) {
          await Promise.all(
            resource.options.actions.map(async (action) => {
              if (typeof action.allowed === 'function') {
                const res = await action.allowed({ adminUser, standardAllowedActions: allowedActions });
                allowedCustomActions.push({ ...action, allowed: !!res });
              } else {
                allowedCustomActions.push({ ...action, allowed: action.allowed !== false });
              }
            })
          );
        }

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
            resourceId: resource.resourceId,
            label: translated.resLabel,
            columns:
              await Promise.all(
                resource.columns.map(
                  async (inCol, i) => {
                    const col = JSON.parse(JSON.stringify(stripResourceColumnFrontendMeta(inCol)));
                    let validation = null;
                    if (col.validation) {
                      validation = await Promise.all(                  
                        col.validation.map(async (val, index) => {
                          return  {
                            ...val,
                            validator: inCol.validation[index].validator ? true: false,
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
                      col.suggestOnCreate = await inCol.suggestOnCreate({ adminUser });
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
              actions: allowedCustomActions.map(({ bulkHandler, action: actionFn, ...rest }) => ({
                ...rest,
                ...(bulkHandler && { bulkHandler: true }),
              })) as AdminForthActionFront[],
              allowedActions,
            } 
        }

        return { 
          resource: toReturn,
        };
      },
    });
    server.endpoint({
      method: 'POST',
      path: '/get_resource_data',
      description: 'Loads resource rows for list, show, or edit views. The endpoint validates access, applies request hooks, filters, sorting, pagination, record labels, and row click URLs, then returns the final dataset with resource options.',
      request_schema: getResourceDataRequestSchema,
      response_schema: getResourceDataResponseSchema,
      handler: async ({ body, adminUser, headers, query, cookies, requestUrl, abortSignal }) => {
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
        if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }
        const hookSource = {
          'show': 'show',
          'list': 'list',
          'edit': 'show',
        }[source];

        for (const hook of listify(resource.hooks?.[hookSource]?.beforeDatasourceRequest as BeforeDataSourceRequestFunction[])) {
          const filterTools = filtersTools.get(body);
          body.filtersTools = filterTools;
          if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }
          const resp = await (hook as BeforeDataSourceRequestFunction)({
            resource,
            query: body,
            adminUser,
            filtersTools: filterTools, 
            extra: {
              body, query, headers, cookies, requestUrl
            },
            adminforth: this.adminforth,
          });
          const hookRespError = hookResponseError(resp);
          if (hookRespError) {
            return hookRespError;
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
        if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }

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
              if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }
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
              if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }

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
          if (this.checkAbortSignal(abortSignal)) { return { error: 'Request aborted' }; }
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
          const hookRespError = hookResponseError(resp);
          if (hookRespError) {
            return hookRespError;
          }
        }

        return data;
      },
    });

    const aggregateRequestSchema: AnySchemaObject = {
      type: 'object',
      $defs: commonFilterSchemaDefs,
      required: ['resourceId', 'aggregations'],
      properties: {
        resourceId: { type: 'string' },
        aggregations: {
          type: 'object',
          description: 'Map of alias → aggregation rule. Each rule has an "operation" (sum, count, avg, min, max, median) and an optional "field".',
          additionalProperties: {
            type: 'object',
            required: ['operation'],
            properties: {
              operation: { type: 'string', enum: ['sum', 'count', 'avg', 'min', 'max', 'median'] },
              field: { type: 'string' },
            },
            additionalProperties: false,
          },
        },
        filters: commonFiltersSchema,
        groupBy: {
          description: 'Optional grouping rule. Either { type: "field", field: "col" } or { type: "date_trunc", field: "col", truncation: "day"|"week"|"month"|"year", timezone?: "IANA/Name" }.',
          anyOf: [
            {
              type: 'object',
              required: ['type', 'field'],
              properties: {
                type: { type: 'string', enum: ['field'] },
                field: { type: 'string' },
              },
              additionalProperties: false,
            },
            {
              type: 'object',
              required: ['type', 'field', 'truncation'],
              properties: {
                type: { type: 'string', enum: ['date_trunc'] },
                field: { type: 'string' },
                truncation: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
                timezone: { type: 'string' },
              },
              additionalProperties: false,
            },
          ],
        },
      },
      additionalProperties: false,
    };

    const aggregateResponseSchema: AnySchemaObject = createErrorOrSuccessSchema({
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          items: genericObjectSchema,
        },
      },
      additionalProperties: true,
    });

    server.endpoint({
      method: 'POST',
      path: '/aggregate',
      description: 'Performs aggregation queries (sum, count, avg, min, max, median) on a resource, with optional grouping by field value or date truncation.',
      request_schema: aggregateRequestSchema,
      response_schema: aggregateResponseSchema,
      handler: async ({ body, adminUser }) => {
        const { resourceId, aggregations, filters, groupBy } = body;
        if (!this.adminforth.statuses.dbDiscover) {
          return { error: 'Database discovery not started' };
        }
        if (this.adminforth.statuses.dbDiscover !== 'done') {
          return { error: 'Database discovery is still in progress, please try later' };
        }
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource ${resourceId} not found` };
        }

        const meta = { requestBody: body, pk: undefined };
        const { allowedActions } = await interpretResource(
          adminUser,
          resource,
          meta,
          ActionCheckSource.ListRequest,
          this.adminforth
        );

        const { allowed, error } = checkAccess(AllowedActionsEnum.list, allowedActions);
        if (!allowed) {
          return { error };
        }

        // normalize filters same way as get_resource_data
        const normalizedFilters = { operator: AdminForthFilterOperators.AND, subFilters: [] };
        if (filters) {
          if (typeof filters !== 'object') {
            return { error: 'Filter should be an array or an object' };
          }
          if (Array.isArray(filters)) {
            normalizedFilters.subFilters = filters;
          } else if (filters.field) {
            normalizedFilters.subFilters = [filters];
          } else if (filters.subFilters) {
            normalizedFilters.operator = filters.operator;
            normalizedFilters.subFilters = filters.subFilters;
          } else {
            return { error: `Wrong filter object value: ${JSON.stringify(filters)}` };
          }
        }

        try {
          const data = await this.adminforth.connectors[resource.dataSource].aggregate({
            resource,
            filters: normalizedFilters as IAdminForthAndOrFilter,
            aggregations,
            groupBy,
          });
          return { data };
        } catch (e) {
          return { error: e.message };
        }
      },
    });

    server.endpoint({
      method: 'POST',
      path: '/get_resource_foreign_data',
      description: 'Loads dropdown options for a foreign-key column. It resolves the referenced resource or polymorphic resources, applies optional search text, hook-injected filters, pagination, and per-record labels, then returns sanitized option items.',
      request_schema: getResourceForeignDataRequestSchema,
      response_schema: getResourceForeignDataResponseSchema,
      handler: async ({ body, adminUser, headers, query, cookies, requestUrl }) => {
        const { resourceId, column, search, currentValue } = body;
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
              if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
                const pkField = targetResource.columns.find((col) => col.primaryKey);
                if (pkField) {
                  normalizedFilters.subFilters.push({ field: pkField.name, operator: AdminForthFilterOperators.EQ, value: currentValue });
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
      description: 'Returns min and max values for resource columns that explicitly opt in to min/max queries. This is used to build range-based filter controls without exposing columns that do not allow the query.',
      request_schema: getMinMaxForColumnsRequestSchema,
      response_schema: getMinMaxForColumnsResponseSchema,
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
      description: 'Creates a new record in the specified resource. The endpoint validates create permissions, required fields, hidden or backend-only field rules, polymorphic foreign keys, and resource hooks before persisting and returning the created primary key.',
      request_schema: createRecordRequestSchema,
      response_schema: createRecordResponseSchema,
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
      description: 'Updates an existing record by primary key. The endpoint validates edit permissions, current record existence, hidden, backend-only, and read-only field rules, polymorphic foreign keys, and resource hooks before saving changes.',
      request_schema: updateRecordRequestSchema,
      response_schema: updateRecordResponseSchema,
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
      description: 'Deletes an existing record by primary key. The endpoint validates delete permissions, loads the current record, executes configured cascade child deletion, and then removes the record.',
      request_schema: deleteRecordRequestSchema,
      response_schema: deleteRecordResponseSchema,
        handler: async ({ body, adminUser, query, headers, cookies, requestUrl, response }) => {
            const resource = this.adminforth.config.resources.find((res) => res.resourceId == body['resourceId']);
            if (!resource) {
                return { error: `Resource '${body['resourceId']}' not found` };
            }
            const record = await this.adminforth.connectors[resource.dataSource].getRecordByPrimaryKey(resource, body['primaryKey']);
            if (!record){
                return { error: `Record with ${body['primaryKey']} not found` };
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

            const { error: cascadeError } = await cascadeChildrenDelete(resource, body.primaryKey, {adminUser, response}, this.adminforth);
            if (cascadeError) {
              return { error: cascadeError };
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
      description: 'Executes a custom resource action for a single record. The endpoint validates the resource, action existence, and action permissions, then either returns a redirect URL or executes the action handler and returns its result together with action context.',
      request_schema: startCustomActionRequestSchema,
      response_schema: startCustomActionResponseSchema,
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
        if (typeof action.allowed === 'function') {
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
    server.endpoint({
      method: 'POST',
      path: '/start_custom_bulk_action',
      description: 'Executes a custom resource action in bulk mode for multiple records. The endpoint validates the resource, action existence, bulk handler availability, and permissions, then runs the bulk handler and returns its result together with action context.',
      request_schema: startCustomBulkActionRequestSchema,
      response_schema: startCustomBulkActionResponseSchema,
      handler: async ({ body, adminUser, tr, response, cookies, headers }) => {
        const { resourceId, actionId, recordIds, extra } = body;
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
        if (!action.bulkHandler) {
          return { error: await tr(`Action "{actionId}" has no bulkHandler`, 'errors', { actionId }) };
        }
        if (typeof action.allowed === 'function') {
          const execAllowed = await action.allowed({ adminUser, standardAllowedActions: allowedActions });
          if (!execAllowed) {
            return { error: await tr(`Action "{actionId}" not allowed`, 'errors', { actionId: action.name }) };
          }
        }
        const result = await action.bulkHandler({
          recordIds,
          adminUser,
          resource,
          tr,
          adminforth: this.adminforth,
          response,
          extra: { ...extra, cookies, headers },
        });
        return { actionId, recordIds, resourceId, ...result };
      }
    });
    server.endpoint({
      method: 'POST',
      path: '/validate_columns',
      description: 'Runs server-side custom validators for editable columns in a resource form. Only validators defined on submitted columns are executed, and the response maps each invalid column to its validation result.',
      request_schema: validateColumnsRequestSchema,
      response_schema: validateColumnsResponseSchema,
      handler: async ({ body, adminUser, query, headers, cookies, requestUrl, response }) => {
        const { resourceId, editableColumns, record } = body;
        const resource = this.adminforth.config.resources.find((res) => res.resourceId == resourceId);
        if (!resource) {
          return { error: `Resource '${resourceId}' not found` };
        }
        const validationResults = {};
        const customColumnValidatorsFunctions = [];
        for (const col of editableColumns) {
          const columnConfig = resource.columns.find((c) => c.name === col.name);
          if (columnConfig && columnConfig.validation)  {
            customColumnValidatorsFunctions.push(async ()=>{
              for (const val of columnConfig.validation) {
                if (val.validator) {
                  const result = await val.validator(col.value, record, this.adminforth);
                  if (typeof result === 'object' && result.isValid === false) {
                    validationResults[col.name] = {
                      isValid: result.isValid,
                      message: result.message,
                    }
                    break;
                  }
                }
              }
            })
          }
        }
        
        if (customColumnValidatorsFunctions.length) {
          await Promise.all(customColumnValidatorsFunctions.map((fn) => fn()));
        }

        return {
          validationResults
        }
      }
    });
    // setup endpoints for all plugins
    this.adminforth.activatedPlugins.forEach((plugin) => {
      plugin.setupEndpoints(server);
    });
    
  }
}
