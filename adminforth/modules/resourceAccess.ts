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
