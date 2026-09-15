import type { AdminForthResource, AdminForthResourceColumn } from '../types/Back.js';

export function normalizeColumnValue(column: AdminForthResourceColumn, value: any): any {
  return column.normalize ? column.normalize(value) : value;
}

export function normalizeRecordValues(resource: AdminForthResource, record: Record<string, any>): void {
  for (const column of resource.columns) {
    if (column.name in record) {
      record[column.name] = normalizeColumnValue(column, record[column.name]);
    }
  }
}
