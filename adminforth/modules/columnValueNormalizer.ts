import type { AdminForthResource, AdminForthResourceColumn } from '../types/Back.js';

export function normalizeColumnValue(column: AdminForthResourceColumn, value: any): any {
  return column.normalize ? column.normalize(value) : value;
}

function toLowerCase(value: any): any {
  if (Array.isArray(value)) {
    return value.map(toLowerCase);
  }
  return typeof value === 'string' ? value.toLowerCase() : value;
}

export function normalizeRecordValues(resource: AdminForthResource, record: Record<string, any>): void {
  for (const column of resource.columns) {
    if (column.name in record) {
      const value = column.enforceLowerCase ? toLowerCase(record[column.name]) : record[column.name];
      record[column.name] = normalizeColumnValue(column, value);
    }
  }
}
