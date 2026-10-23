import { AdminForthDataTypes } from '../types/Common.js';
import type { AdminForthResource, AdminForthResourceColumn, IAdminForth } from '../types/Back.js';

const LENGTH_LIMITED_TYPES = [AdminForthDataTypes.STRING, AdminForthDataTypes.TEXT];
const VALUE_LIMITED_TYPES = [AdminForthDataTypes.INTEGER, AdminForthDataTypes.DECIMAL, AdminForthDataTypes.FLOAT];

function isEmptyValue(value: any): boolean {
  return value === undefined || value === null || value === '';
}

// connectors discover an absent limit as null
function isLimitSet(limit: number | null | undefined): boolean {
  return limit !== undefined && limit !== null;
}

/**
 * Same emptiness as the create/edit form uses for required columns
 */
export function isEmptyColumnValue(column: AdminForthResourceColumn, value: any): boolean {
  return isEmptyValue(value) || (!!column.isArray?.enabled && value.length === 0);
}

function validateItemValue(column: AdminForthResourceColumn, type: AdminForthDataTypes, value: any): string | null {
  if (LENGTH_LIMITED_TYPES.includes(type)) {
    if (isLimitSet(column.maxLength) && value.length > column.maxLength) {
      return `Value in "${column.name}" must not be longer than ${column.maxLength} characters`;
    }
    if (isLimitSet(column.minLength) && value.length < column.minLength) {
      return `Value in "${column.name}" must not be shorter than ${column.minLength} characters`;
    }
  }
  if (VALUE_LIMITED_TYPES.includes(type)) {
    if (isLimitSet(column.minValue) && value < column.minValue) {
      return `Value in "${column.name}" must be greater than ${column.minValue}`;
    }
    if (isLimitSet(column.maxValue) && value > column.maxValue) {
      return `Value in "${column.name}" must be less than ${column.maxValue}`;
    }
  }
  if (column.enum && !column.enum.some((item) => item.value === value)) {
    return `Value in "${column.name}" must be one of: ${column.enum.map((item) => item.value).join(', ')}`;
  }
  return null;
}

/**
 * Checks a non-empty column value against length and value limits, enum and array rules
 */
export function validateColumnValue(column: AdminForthResourceColumn, value: any): string | null {
  if (!column.isArray?.enabled) {
    return validateItemValue(column, column.type, value);
  }
  if (value.some(isEmptyValue)) {
    return `Array in "${column.name}" cannot contain empty items`;
  }
  if (!column.isArray.allowDuplicateItems && new Set(value).size !== value.length) {
    return `Array in "${column.name}" cannot contain duplicate items`;
  }
  for (const item of value) {
    const error = validateItemValue(column, column.isArray.itemType, item);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Runs custom `validator` callbacks of the column and returns the first failed result
 */
export async function runColumnValidators(
  column: AdminForthResourceColumn,
  value: any,
  record: any,
  adminforth: IAdminForth,
): Promise<{ isValid: false, message?: string } | null> {
  for (const val of column.validation ?? []) {
    if (val.validator) {
      const result = await val.validator(value, record, adminforth);
      if (typeof result === 'object' && result.isValid === false) {
        return { isValid: false, message: result.message };
      }
    }
  }
  return null;
}

/**
 * Runs custom validators of the columns present in `values`, `record` is the whole record they are passed
 */
export async function runRecordValidators(
  resource: AdminForthResource,
  values: any,
  record: any,
  adminforth: IAdminForth,
): Promise<string | null> {
  for (const column of resource.columns.filter((col) => col.name in values)) {
    const failed = await runColumnValidators(column, values[column.name], record, adminforth);
    if (failed) {
      return failed.message ?? `Value in "${column.name}" is invalid`;
    }
  }
  return null;
}
