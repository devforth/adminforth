import type { AdminForthResource, AdminForthResourceColumn } from '../types/Back.js';

/**
 * Separator used to glue values of composite primary key columns into one record id string.
 * Values are URI-encoded before gluing, and '~' inside of value is escaped to '%7E',
 * so separator can't appear in encoded parts.
 */
export const COMPOSITE_RECORD_ID_SEPARATOR = '~';

/**
 * Returns all columns marked with primaryKey: true, in order in which they are defined in resource.
 * For resources with composite primary key returns more than one column.
 */
export function primaryKeyColumns(resource: AdminForthResource): AdminForthResourceColumn[] {
  const columns = (resource.dataSourceColumns?.length ? resource.dataSourceColumns : resource.columns) || [];
  return columns.filter((col) => col.primaryKey);
}

export function primaryKeyColumnNames(resource: AdminForthResource): string[] {
  return primaryKeyColumns(resource).map((col) => col.name);
}

export function isCompositePrimaryKey(resource: AdminForthResource): boolean {
  return primaryKeyColumns(resource).length > 1;
}

function escapeRecordIdPart(value: any): string {
  // encodeURIComponent does not escape '~' (it is unreserved), so escape it manually
  return encodeURIComponent(String(value)).replace(/~/g, '%7E');
}

function unescapeRecordIdPart(part: string): string {
  return decodeURIComponent(part);
}

/**
 * Foreign resource columns are returned to frontend as { pk, label } objects,
 * so unwrap them when record id is built from such record
 */
function unwrapPrimaryKeyValue(value: any): any {
  if (value !== null && typeof value === 'object' && 'pk' in value) {
    return (value as any).pk;
  }
  return value;
}

/**
 * Builds record id (value used in urls and in all AdminForth APIs) from record object.
 *
 * For resource with single primary key column returns raw value of that column (no encoding is done,
 * so behavior is fully backward compatible).
 *
 * For resource with composite primary key returns string like 'BTC~ERC20' where each part is
 * URI-encoded value of corresponding primary key column, in order of definition in resource.
 */
export function encodeRecordId(resource: AdminForthResource, record: any): any {
  const pkColumns = primaryKeyColumns(resource);
  if (!pkColumns.length) {
    throw new Error(`Resource '${resource.resourceId}' has no primaryKey column`);
  }
  if (pkColumns.length === 1) {
    return unwrapPrimaryKeyValue(record?.[pkColumns[0].name]);
  }
  return pkColumns.map((col) => {
    const value = unwrapPrimaryKeyValue(record?.[col.name]);
    if (value === undefined || value === null) {
      throw new Error(
        `Can't build record id for resource '${resource.resourceId}': primary key column '${col.name}' has no value in record`
      );
    }
    return escapeRecordIdPart(value);
  }).join(COMPOSITE_RECORD_ID_SEPARATOR);
}

/**
 * Splits record id back into values of primary key columns.
 * Returns object like { assetSymbol: 'BTC', networkCode: 'ERC20' }.
 *
 * Values are returned as strings for composite keys (they come from url/API),
 * connectors cast them to column types using setFieldValue.
 */
export function decodeRecordId(resource: AdminForthResource, recordId: any): Record<string, any> {
  const pkColumns = primaryKeyColumns(resource);
  if (!pkColumns.length) {
    throw new Error(`Resource '${resource.resourceId}' has no primaryKey column`);
  }
  if (pkColumns.length === 1) {
    return { [pkColumns[0].name]: recordId };
  }
  const parts = String(recordId).split(COMPOSITE_RECORD_ID_SEPARATOR);
  if (parts.length !== pkColumns.length) {
    throw new Error(
      `Record id '${recordId}' is not valid for resource '${resource.resourceId}': expected ${pkColumns.length} ` +
      `parts (${pkColumns.map((col) => col.name).join(', ')}) separated by '${COMPOSITE_RECORD_ID_SEPARATOR}', got ${parts.length}`
    );
  }
  return pkColumns.reduce((acc, col, i) => {
    acc[col.name] = unescapeRecordIdPart(parts[i]);
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Returns pkValues argument for connector's updateRecordOriginalValues/deleteRecord.
 *
 * Returns undefined for resources with single primary key, so connectors receive exactly the same
 * arguments as before composite primary key support was added (pure extension, old path untouched).
 */
export function compositePkValues(
  connector: { getPrimaryKeyValues?: (resource: AdminForthResource, recordId: any) => Record<string, any> },
  resource: AdminForthResource,
  recordId: any,
): Record<string, any> | undefined {
  if (!isCompositePrimaryKey(resource)) {
    return undefined;
  }
  return connector.getPrimaryKeyValues?.(resource, recordId);
}
