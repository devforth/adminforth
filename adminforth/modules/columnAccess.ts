import type {
  AdminForthResource,
  AllowedActionValue,
  BackendOnlyInput,
  IAdminForth,
  IAdminForthSort,
} from '../types/Back.js';
import {
  ActionCheckSource,
  type AdminUser,
} from '../types/Common.js';

/**
 * Everything a column rule needs to resolve itself. Column rules may be plain booleans or
 * functions of the current user and request, so they can only be answered in a context.
 */
export interface ColumnAccessContext {
  adminUser: AdminUser;
  resource: AdminForthResource;
  meta: any;
  source: ActionCheckSource;
  adminforth: IAdminForth;
}

export async function resolveBoolOrFn(
  value: BackendOnlyInput | AllowedActionValue | undefined,
  ctx: ColumnAccessContext,
): Promise<boolean> {
  if (typeof value === 'function') {
    return !!(await value(ctx));
  }
  return !!value;
}

export async function isBackendOnly(
  column: AdminForthResource['columns'][number],
  ctx: ColumnAccessContext,
): Promise<boolean> {
  return resolveBoolOrFn(column.backendOnly, ctx);
}

export async function isShown(
  column: AdminForthResource['columns'][number],
  page: 'list' | 'show' | 'edit' | 'create' | 'filter',
  ctx: ColumnAccessContext,
): Promise<boolean> {
  const showIn = column.showIn as Record<string, AllowedActionValue> | undefined;
  if (showIn?.[page] !== undefined) {
    return resolveBoolOrFn(showIn[page], ctx);
  }
  if (showIn?.all !== undefined) {
    return resolveBoolOrFn(showIn.all, ctx);
  }
  return true;
}

/**
 * Checks every field the caller wants to write against the column rules which restrict writing:
 * backendOnly, editReadonly, showIn plus its allowModifyWhenNotShowIn* / fillOnCreate escapes.
 *
 * @returns the reason the record cannot be written, or null when it can.
 */
export async function recordWriteError(
  ctx: ColumnAccessContext,
  record: Record<string, any>,
  mode: 'create' | 'edit',
): Promise<string | null> {
  for (const column of ctx.resource.columns) {
    const fieldName = column.name;
    if (!(fieldName in record)) {
      continue;
    }

    if (await isBackendOnly(column, ctx)) {
      return `Field "${fieldName}" cannot be modified as it is restricted from `
        + `${mode === 'create' ? 'creation' : 'editing'} (backendOnly is true).`;
    }

    const shown = await isShown(column, mode, ctx);

    if (mode === 'create') {
      if (!shown && !column.fillOnCreate && !column.allowModifyWhenNotShowInCreate) {
        return `Field "${fieldName}" cannot be modified as it is restricted from creation `
          + `(showIn.create is false). If you need to set this hidden field during creation, either `
          + `configure column.fillOnCreate or set column.allowModifyWhenNotShowInCreate = true.`;
      }
      continue;
    }

    if (column.editReadonly) {
      return `Field "${fieldName}" cannot be modified as it is restricted from editing `
        + `(editReadonly is true).`;
    }

    if (!shown && !column.allowModifyWhenNotShowInEdit) {
      return `Field "${fieldName}" cannot be modified as it is restricted from editing `
        + `(showIn.edit is false). If you need to allow updating this hidden field during editing, `
        + `set column.allowModifyWhenNotShowInEdit = true.`;
    }
  }

  return null;
}

/**
 * Drops in place every key the user is not allowed to read: backendOnly columns, and keys which
 * are not described in the resource at all.
 */
export async function stripReadForbiddenColumns(
  ctx: ColumnAccessContext,
  record: Record<string, any>,
): Promise<Record<string, any>> {
  for (const key of Object.keys(record)) {
    const column = ctx.resource.columns.find((candidate) => candidate.name === key);
    if (!column || await isBackendOnly(column, ctx)) {
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

/**
 * Filter values are never echoed back, but combined with any readable output they turn into an
 * oracle which reads a hidden value out one comparison at a time, so backendOnly columns must not
 * be filterable either.
 *
 * @returns the reason the filter cannot be used, or null when it can.
 */
export async function filterColumnsReadableError(
  ctx: ColumnAccessContext,
  filters: any,
): Promise<string | null> {
  for (const fieldName of collectFilterFields(filters)) {
    const column = ctx.resource.columns.find((candidate) => candidate.name === fieldName);
    if (column && await isBackendOnly(column, ctx)) {
      return `Filter: column "${fieldName}" cannot be used (backendOnly is true).`;
    }
  }

  return null;
}

/** Sorting can reveal a hidden field through the order of otherwise readable rows. */
export async function sortColumnsReadableError(
  ctx: ColumnAccessContext,
  sort: IAdminForthSort | IAdminForthSort[],
): Promise<string | null> {
  const rules = Array.isArray(sort) ? sort : [sort];
  for (const rule of rules) {
    const column = ctx.resource.columns.find((candidate) => candidate.name === rule.field);
    if (column && await isBackendOnly(column, ctx)) {
      return `Sort: column "${rule.field}" cannot be used (backendOnly is true).`;
    }
  }
  return null;
}

/**
 * A column may only take part in an aggregation if the user could have read the very same value
 * from the show view, otherwise min/max/groupBy become a way to read hidden columns.
 *
 * @returns the reason the aggregation cannot run, or null when it can.
 */
export async function columnsAggregatableError(
  ctx: ColumnAccessContext,
  query: {
    aggregations?: { [alias: string]: { field?: string } };
    groupBy?: { field?: string } | Array<{ field?: string }>;
    filters?: any;
  },
): Promise<string | null> {
  const exposureError = async (fieldName: string, label: string): Promise<string | null> => {
    const column = ctx.resource.columns.find((candidate) => candidate.name === fieldName);
    if (!column) {
      return `${label}: unknown column "${fieldName}"`;
    }
    if (await isBackendOnly(column, ctx)) {
      return `${label}: column "${fieldName}" cannot be aggregated (backendOnly is true).`;
    }
    if (!await isShown(column, 'show', ctx)) {
      return `${label}: column "${fieldName}" cannot be aggregated (showIn.show is false).`;
    }
    return null;
  };

  for (const [alias, rule] of Object.entries(query.aggregations || {})) {
    // plain count does not reference any column
    if (!rule?.field) {
      continue;
    }
    const error = await exposureError(rule.field, `Aggregation "${alias}"`);
    if (error) {
      return error;
    }
  }

  const groupByRules = Array.isArray(query.groupBy) ? query.groupBy : (query.groupBy ? [query.groupBy] : []);
  for (const groupByRule of groupByRules) {
    if (!groupByRule?.field) {
      continue;
    }
    const error = await exposureError(groupByRule.field, 'GroupBy');
    if (error) {
      return error;
    }
  }

  return filterColumnsReadableError(ctx, query.filters);
}
