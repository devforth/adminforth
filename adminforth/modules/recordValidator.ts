import type { AdminForthResource } from '../types/Back.js';
import { applyRegexValidation } from './utils.js';

/**
 * Column-level value rules: `validation` patterns and `minValue`/`maxValue` bounds.
 * Depends on nothing but the resource columns, so any layer can apply it.
 *
 * @returns the first validation error, or null when the record passes.
 */
export function validateRecordValues(resource: AdminForthResource, record: any, mode: 'create' | 'edit'): string | null {
  // check if record with validation is valid
  for (const column of resource.columns.filter((col) => col.name in record && col.validation)) {
    const required = typeof column.required === 'object'
    ? column.required[mode]
    : true;

    if (!required && !record[column.name]) continue;

    let error = null;
    if (column.isArray?.enabled) {
      error = record[column.name].reduce((err, item) => {
        return err || applyRegexValidation(item, column.validation);
      }, null);
    } else {
      error = applyRegexValidation(record[column.name], column.validation);
    }
    if (error) {
      return error;
    }
  }

  // check if record with minValue or maxValue is within limits
  for (const column of resource.columns.filter((col) => col.name in record
    && ['integer', 'decimal', 'float'].includes(col.isArray?.enabled ? col.isArray.itemType : col.type)
    && (col.minValue !== undefined || col.maxValue !== undefined))) {
    if (column.isArray?.enabled) {
      const error = record[column.name].reduce((err, item) => {
        if (err) return err;

        if (column.minValue !== undefined && item < column.minValue) {
          return `Value in "${column.name}" must be greater than ${column.minValue}`;
        }
        if (column.maxValue !== undefined && item > column.maxValue) {
          return `Value in "${column.name}" must be less than ${column.maxValue}`;
        }

        return null;
      }, null);
      if (error) {
        return error;
      }
    } else {
      if (column.minValue !== undefined && record[column.name] && record[column.name] < column.minValue) {
        return `Value in "${column.name}" must be greater than ${column.minValue}`;
      }
      if (column.maxValue !== undefined && record[column.name] && record[column.name] > column.maxValue) {
        return `Value in "${column.name}" must be less than ${column.maxValue}`;
      }
    }
  }

  return null;
}
