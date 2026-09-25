import type { AdminForthResource, AllowedActionValue, IAdminForth } from '../types/Back.js';
import {
  ActionCheckSource,
  AllowedActionsEnum,
  type AdminUser,
  type AllowedActionsResolved,
} from '../types/Common.js';
import { afLogger } from './logger.js';

export async function interpretResource(
  adminUser: AdminUser,
  resource: AdminForthResource,
  meta: any,
  source: ActionCheckSource,
  adminforth: IAdminForth,
): Promise<{ allowedActions: AllowedActionsResolved }> {
  afLogger.trace(`🪲Interpreting resource, ${resource.resourceId}, ${source}, 'adminUser', ${adminUser}`);
  const allowedActions = {} as AllowedActionsResolved;
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

        allowedActions[key] = typeof value === 'function'
          ? await value({ adminUser, resource, meta, source, adminforth })
          : value;
      },
    ),
  );

  return { allowedActions };
}

export const RESOURCE_ACCESS_GRANT = Symbol('resourceAccessGrant');

type ResourceAccessGrant = object;

const grantedOperations = new WeakMap<ResourceAccessGrant, {
  adminUser: AdminUser;
  resource: AdminForthResource;
  action: AllowedActionsEnum;
  record: any;
  primaryKey: any;
}>();

/** The REST preflight checks access before returning field or existence errors. */
export async function authorizeResourceOperation(
  adminUser: AdminUser,
  resource: AdminForthResource,
  meta: any,
  source: ActionCheckSource,
  action: AllowedActionsEnum,
  adminforth: IAdminForth,
  record: any,
  primaryKey?: any,
): Promise<{ error: string | null; grant?: ResourceAccessGrant }> {
  const { allowedActions } = await interpretResource(adminUser, resource, meta, source, adminforth);
  const allowed = allowedActions[action] as boolean | string | undefined;
  if (allowed !== true) {
    return { error: typeof allowed === 'string' ? allowed : 'Action is not allowed' };
  }

  const grant = {};
  grantedOperations.set(grant, { adminUser, resource, action, record, primaryKey });
  return { error: null, grant };
}

/** A grant can only skip the matching scoped ACL check once; row scope still runs normally. */
export function consumeResourceAccessGrant(
  grant: ResourceAccessGrant | undefined,
  adminUser: AdminUser,
  resource: AdminForthResource,
  action: AllowedActionsEnum,
  record: any,
  primaryKey?: any,
): boolean {
  if (!grant) {
    return false;
  }
  const granted = grantedOperations.get(grant);
  grantedOperations.delete(grant);
  return granted?.adminUser === adminUser
    && granted.resource === resource
    && granted.action === action
    && granted.record === record
    && granted.primaryKey === primaryKey;
}
