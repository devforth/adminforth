import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useCoreStore } from '../stores/core';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_DATES_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';

type DateLike = string | number | Date | null | undefined;

/**
 * Date format configured in customization.datesFormat (or a sane default).
 */
export function getDatesFormat(): string {
  return useCoreStore().config?.datesFormat || DEFAULT_DATES_FORMAT;
}

/**
 * Time format configured in customization.timeFormat (or a sane default).
 */
export function getTimeFormat(): string {
  return useCoreStore().config?.timeFormat || DEFAULT_TIME_FORMAT;
}

/**
 * Formats UTC datetime into user's local time using formats from customization settings.
 * Use it instead of toLocaleString() everywhere, so all dates in admin look the same.
 */
export function formatDateTime(date: DateLike): string {
  if (!date) return '';
  return dayjs.utc(date).local().format(`${getDatesFormat()} ${getTimeFormat()}`);
}

/**
 * Formats date using format from customization settings.
 */
export function formatDate(date: DateLike): string {
  if (!date) return '';
  return dayjs.utc(date).local().format(getDatesFormat());
}

/**
 * Formats standalone time value (e.g. "13:45:00") using format from customization settings.
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return dayjs(`0000-00-00 ${time}`).format(getTimeFormat());
}
