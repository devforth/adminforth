import type {
  AdminForthResource,
  AllowedActionValue,
  BackendOnlyInput,
  IAdminForth,
} from '../types/Back.js';
import {
  ActionCheckSource,
  type AdminUser,
} from '../types/Common.js';

export interface ColumnAccessContext {
  adminUser: AdminUser;
  resource: AdminForthResource;
  meta: any;
  source: ActionCheckSource;
  adminforth: IAdminForth;
}

export async function resolveBoolOrFn(
  value: BackendOnlyInput | AllowedActionValue | undefined,
  context: ColumnAccessContext,
): Promise<boolean> {
  if (typeof value === 'function') {
    return !!(await value(context));
  }
  return !!value;
}

export async function isBackendOnly(
  column: AdminForthResource['columns'][number],
  context: ColumnAccessContext,
): Promise<boolean> {
  return resolveBoolOrFn(column.backendOnly, context);
}

export async function isShown(
  column: AdminForthResource['columns'][number],
  page: 'list' | 'show' | 'edit' | 'create' | 'filter',
  context: ColumnAccessContext,
): Promise<boolean> {
  const showIn = column.showIn as Record<string, AllowedActionValue> | undefined;
  if (showIn?.[page] !== undefined) {
    return resolveBoolOrFn(showIn[page], context);
  }
  if (showIn?.all !== undefined) {
    return resolveBoolOrFn(showIn.all, context);
  }
  return true;
}

export interface AssertRecordWritableParams {
  resource: AdminForthResource;
  record: Record<string, any>;
  mode: 'create' | 'edit';
  adminUser: AdminUser;
  meta: any;
  adminforth: IAdminForth;
}

export async function assertRecordWritable({
  resource,
  record,
  mode,
  adminUser,
  meta,
  adminforth,
}: AssertRecordWritableParams): Promise<void> {
  const context: ColumnAccessContext = {
    adminUser,
    resource,
    meta,
    source: mode === 'create' ? ActionCheckSource.CreateRequest : ActionCheckSource.EditRequest,
    adminforth,
  };

  for (const column of resource.columns) {
    const fieldName = column.name;
    if (!(fieldName in record)) {
      continue;
    }

    const shown = await isShown(column, mode, context);
    const backendOnly = await isBackendOnly(column, context);

    if (backendOnly) {
      throw new Error(
        `Field "${fieldName}" cannot be modified as it is restricted from ${mode === 'create' ? 'creation' : 'editing'} (backendOnly is true).`,
      );
    }

    if (mode === 'create') {
      if (
        !shown
        && !column.fillOnCreate
        && !column.allowModifyWhenNotShowInCreate
      ) {
        throw new Error(
          `Field "${fieldName}" cannot be modified as it is restricted from creation (showIn.create is false). If you need to set this hidden field during creation, either configure column.fillOnCreate or set column.allowModifyWhenNotShowInCreate = true.`,
        );
      }
      continue;
    }

    if (column.editReadonly) {
      throw new Error(
        `Field "${fieldName}" cannot be modified as it is restricted from editing (editReadonly is true).`,
      );
    }

    if (!shown && !column.allowModifyWhenNotShowInEdit) {
      throw new Error(
        `Field "${fieldName}" cannot be modified as it is restricted from editing (showIn.edit is false). If you need to allow updating this hidden field during editing, set column.allowModifyWhenNotShowInEdit = true.`,
      );
    }
  }
}

export interface StripReadForbiddenColumnsParams {
  resource: AdminForthResource;
  record: Record<string, any>;
  adminUser: AdminUser;
  meta: any;
  source: ActionCheckSource;
  adminforth: IAdminForth;
}

export async function stripReadForbiddenColumns({
  resource,
  record,
  adminUser,
  meta,
  source,
  adminforth,
}: StripReadForbiddenColumnsParams): Promise<Record<string, any>> {
  const context: ColumnAccessContext = {
    adminUser,
    resource,
    meta,
    source,
    adminforth,
  };

  for (const key of Object.keys(record)) {
    const column = resource.columns.find((candidate) => candidate.name === key);
    if (!column || await isBackendOnly(column, context)) {
      delete record[key];
    }
  }

  return record;
}

/**
 * Collects every column name referenced anywhere in a (possibly nested) filter tree,
 * so the caller can check those columns against the visibility rules.
 */
export function collectFilterFields(filters: any, fields: Set<string> = new Set()): Set<string> {
  if (!filters || typeof filters !== 'object') {
    return fields;
  }

  if (Array.isArray(filters)) {
    filters.forEach((filter) => collectFilterFields(filter, fields));
    return fields;
  }

  if (typeof filters.field === 'string') {
    fields.add(filters.field);
  }
  if (typeof filters.rightField === 'string') {
    fields.add(filters.rightField);
  }
  if (Array.isArray(filters.subFilters)) {
    filters.subFilters.forEach((filter) => collectFilterFields(filter, fields));
  }

  return fields;
}

export interface AssertFilterColumnsReadableParams {
  resource: AdminForthResource;
  filters: any;
  adminUser: AdminUser;
  meta: any;
  source: ActionCheckSource;
  adminforth: IAdminForth;
}

/**
 * Filter values are never echoed back, but combined with any readable output they turn into an
 * oracle which reads a hidden value out one comparison at a time, so backendOnly columns must not
 * be filterable either.
 */
export async function assertFilterColumnsReadable({
  resource,
  filters,
  adminUser,
  meta,
  source,
  adminforth,
}: AssertFilterColumnsReadableParams): Promise<void> {
  const context: ColumnAccessContext = { adminUser, resource, meta, source, adminforth };

  for (const fieldName of collectFilterFields(filters)) {
    const column = resource.columns.find((candidate) => candidate.name === fieldName);
    if (column && await isBackendOnly(column, context)) {
      throw new Error(`Filter: column "${fieldName}" cannot be used (backendOnly is true).`);
    }
  }
}

export interface AssertColumnsAggregatableParams {
  resource: AdminForthResource;
  aggregations?: { [alias: string]: { field?: string } };
  groupBy?: { field?: string } | Array<{ field?: string }>;
  filters?: any;
  adminUser: AdminUser;
  meta: any;
  adminforth: IAdminForth;
}

/**
 * A column may only take part in an aggregation if the user could have read the very same value
 * from the show view, otherwise min/max/groupBy become a way to read hidden columns.
 */
export async function assertColumnsAggregatable({
  resource,
  aggregations,
  groupBy,
  filters,
  adminUser,
  meta,
  adminforth,
}: AssertColumnsAggregatableParams): Promise<void> {
  const context: ColumnAccessContext = {
    adminUser,
    resource,
    meta,
    source: ActionCheckSource.ShowRequest,
    adminforth,
  };

  const assertExposable = async (fieldName: string, label: string): Promise<void> => {
    const column = resource.columns.find((candidate) => candidate.name === fieldName);
    if (!column) {
      throw new Error(`${label}: unknown column "${fieldName}"`);
    }
    if (await isBackendOnly(column, context)) {
      throw new Error(`${label}: column "${fieldName}" cannot be aggregated (backendOnly is true).`);
    }
    if (!await isShown(column, 'show', context)) {
      throw new Error(`${label}: column "${fieldName}" cannot be aggregated (showIn.show is false).`);
    }
  };

  for (const [alias, rule] of Object.entries(aggregations || {})) {
    // plain count does not reference any column
    if (!rule?.field) {
      continue;
    }
    await assertExposable(rule.field, `Aggregation "${alias}"`);
  }

  const groupByRules = Array.isArray(groupBy) ? groupBy : (groupBy ? [groupBy] : []);
  for (const groupByRule of groupByRules) {
    if (!groupByRule?.field) {
      continue;
    }
    await assertExposable(groupByRule.field, 'GroupBy');
  }

  await assertFilterColumnsReadable({
    resource,
    filters,
    adminUser,
    meta,
    source: ActionCheckSource.ShowRequest,
    adminforth,
  });
}
