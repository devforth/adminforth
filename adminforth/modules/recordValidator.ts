import type { AdminForthResource } from '../types/Back.js';
import { applyRegexValidation } from './utils.js';
import { isEmptyColumnValue, validateColumnValue } from './columnValueValidator.js';

/**
 * Column-level value rules: `validation` patterns, length and value limits, enum and array rules.
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

  // empty values are checked by required rules
  for (const column of resource.columns.filter((col) => col.name in record && !isEmptyColumnValue(col, record[col.name]))) {
    const error = validateColumnValue(column, record[column.name]);
    if (error) {
      return error;
    }
  }

  return null;
}
