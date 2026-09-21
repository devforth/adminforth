import type { AdminForthResourceColumnCommon } from '@/types/Common';

/**
 * Minimal shape needed to build/parse record id (works both for AdminForthResourceCommon and
 * AdminForthResourceFrontend)
 */
export interface ResourceWithPrimaryKey {
  resourceId?: string;
  columns: AdminForthResourceColumnCommon[];
}

/**
 * Separator used to glue values of composite primary key columns into one record id string.
 * Must be kept in sync with adminforth/modules/recordId.ts on backend.
 */
export const COMPOSITE_RECORD_ID_SEPARATOR = '~';

export function primaryKeyColumns(resource: ResourceWithPrimaryKey): AdminForthResourceColumnCommon[] {
  return (resource?.columns || []).filter((col: AdminForthResourceColumnCommon) => col.primaryKey);
}

export function primaryKeyColumnNames(resource: ResourceWithPrimaryKey): string[] {
  return primaryKeyColumns(resource).map((col) => col.name);
}

export function isCompositePrimaryKey(resource: ResourceWithPrimaryKey): boolean {
  return primaryKeyColumns(resource).length > 1;
}

function escapeRecordIdPart(value: any): string {
  return encodeURIComponent(String(value)).replace(/~/g, '%7E');
}

function unescapeRecordIdPart(part: string): string {
  return decodeURIComponent(part);
}

/**
 * foreignResource columns come from backend as { pk, label } objects
 */
function unwrapPrimaryKeyValue(value: any): any {
  if (value !== null && typeof value === 'object' && 'pk' in value) {
    return value.pk;
  }
  return value;
}

/**
 * Builds record id (value used in urls) from row.
 * For single primary key returns raw value, for composite one returns parts glued with '~'.
 */
export function encodeRecordId(resource: ResourceWithPrimaryKey, record: any): any {
  const pkColumns = primaryKeyColumns(resource);
  if (!pkColumns.length) {
    throw new Error(`Primary key not found in resource ${resource?.resourceId}`);
  }
  if (pkColumns.length === 1) {
    return unwrapPrimaryKeyValue(record?.[pkColumns[0].name]);
  }
  return pkColumns
    .map((col) => escapeRecordIdPart(unwrapPrimaryKeyValue(record?.[col.name])))
    .join(COMPOSITE_RECORD_ID_SEPARATOR);
}

/**
 * Splits record id into values of primary key columns
 */
export function decodeRecordId(resource: ResourceWithPrimaryKey, recordId: any): Record<string, any> {
  const pkColumns = primaryKeyColumns(resource);
  if (!pkColumns.length) {
    throw new Error(`Primary key not found in resource ${resource?.resourceId}`);
  }
  if (pkColumns.length === 1) {
    return { [pkColumns[0].name]: recordId };
  }
  const parts = String(recordId).split(COMPOSITE_RECORD_ID_SEPARATOR);
  if (parts.length !== pkColumns.length) {
    throw new Error(
      `Record id '${recordId}' is not valid for resource '${resource?.resourceId}': expected ` +
      `${pkColumns.length} parts separated by '${COMPOSITE_RECORD_ID_SEPARATOR}'`
    );
  }
  return pkColumns.reduce((acc: Record<string, any>, col, i) => {
    acc[col.name] = unescapeRecordIdPart(parts[i]);
    return acc;
  }, {});
}

/**
 * Filters which select exactly one record with given record id
 */
export function recordIdFilters(resource: ResourceWithPrimaryKey, recordId: any) {
  const values = decodeRecordId(resource, recordId);
  return primaryKeyColumnNames(resource).map((name) => ({
    field: name,
    operator: 'eq',
    value: values[name],
  }));
}
