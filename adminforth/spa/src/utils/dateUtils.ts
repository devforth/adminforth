import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localeData from 'dayjs/plugin/localeData';
import { useCoreStore } from '../stores/core';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localeData);

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

/** A day picked in a date picker: "2026-10-14", without time and timezone. */
export const PICKER_DAY_FORMAT = 'YYYY-MM-DD';
/** A picked day in the field of a date picker, the month is a word so the order of the parts is never ambiguous. */
const PICKER_DISPLAY_FORMAT = 'DD MMM YYYY';

/** A run of letters or a run of digits, so "18Aug2003" and "Jun 23, 2022 ·" both tokenize cleanly. */
const DATE_TOKEN_RE = /\p{L}+|\p{N}+/gu;
/** Time (and timezone offset) part of a pasted datetime, dropped before tokenizing the date. */
const TIME_PART_RE = /\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*([ap]\.?m\.?)?/gi;
/** A token consisting of digits only. */
const DIGITS_RE = /^\p{N}+$/u;

const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_MONTHS_SHORT = EN_MONTHS.map(m => m.slice(0, 3));

/** Two-digit years below this belong to the 2000s, the rest to the 1900s. */
const CENTURY_PIVOT = 50;
/** Shortest month abbreviation across locales; single letters would match random words. */
const MIN_MONTH_NAME_LENGTH = 2;

/**
 * Month names of the active dayjs locale (the i18n plugin switches it), full and short. "D MMMM" gives the form
 * a month takes inside a date, in uk and ru it differs from the standalone one ("14 січня", "січень").
 */
function localeMonthNames(): string[][] {
  const months = Array.from({ length: 12 }, (_, month) => dayjs().startOf('year').month(month));
  const dayPrefix = months[0].format('D ');
  return [
    months.map(m => m.format('MMM')),
    months.map(m => m.format('MMMM')),
    months.map(m => m.format('D MMM').slice(dayPrefix.length)),
    months.map(m => m.format('D MMMM').slice(dayPrefix.length)),
  ];
}

function findMonthIndex(name: string): number {
  if (name.length < MIN_MONTH_NAME_LENGTH) {
    return -1;
  }
  const lowered = name.toLowerCase();
  const startsWithToken = (monthName: string) => monthName.toLowerCase().startsWith(lowered);
  // both short and full names, in the active language and in English (pasted dates are often English)
  for (const names of [...localeMonthNames(), EN_MONTHS_SHORT, EN_MONTHS]) {
    const index = names.findIndex(startsWithToken);
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

function normalizeYear(year: number, digits: number): number {
  if (digits > 2) {
    return year;
  }
  return year < CENTURY_PIVOT ? 2000 + year : 1900 + year;
}

/**
 * Parses a human-typed or pasted date in whatever order the parts came in:
 * "18 Aug 2003", "Aug 18, 2003", "18.08.2003", "2003-08-18", "Jun 23, 2022 ·", "14 січня".
 * Returns the day in PICKER_DAY_FORMAT, or null when the string is not a date.
 */
export function parseFlexibleDate(dateStr: string): string | null {
  const tokens = dateStr.replace(TIME_PART_RE, ' ').match(DATE_TOKEN_RE) || [];

  let month = -1;
  const numbers: { value: number, digits: number }[] = [];
  for (const token of tokens) {
    if (DIGITS_RE.test(token)) {
      numbers.push({ value: parseInt(token, 10), digits: token.length });
    } else if (month < 0) {
      month = findMonthIndex(token);
    }
  }

  const yearIndex = numbers.findIndex(n => n.digits > 2);
  const yearToken = yearIndex >= 0 ? numbers.splice(yearIndex, 1)[0] : undefined;

  let day: number;
  if (month >= 0) {
    day = numbers.length ? numbers.shift()!.value : 1;
  } else if (numbers.length >= 2) {
    // year first means ISO-like order, otherwise day first (the format we render)
    const [first, second] = yearIndex === 0 ? [numbers[1], numbers[0]] : numbers;
    day = first.value;
    month = second.value - 1;
    numbers.splice(0, 2);
    if (month > 11 && day <= 12) {
      [day, month] = [month + 1, day - 1];
    }
  } else if (numbers.length === 1) {
    day = numbers.shift()!.value;
    month = new Date().getMonth();
  } else {
    return null;
  }

  const leftover = numbers.shift();
  const year = yearToken
    ? normalizeYear(yearToken.value, yearToken.digits)
    : leftover
      ? normalizeYear(leftover.value, leftover.digits)
      : new Date().getFullYear();

  const date = new Date(year, month, day);
  date.setFullYear(year);
  // rejects impossible dates like "31 Feb" instead of silently rolling them over
  return date.getMonth() === month && date.getDate() === day ? dayjs(date).format(PICKER_DAY_FORMAT) : null;
}

/** A picked day as the field of a date picker shows it: "14 Oct 2026", month names in the active language. */
export function formatPickerDay(day: string): string {
  return dayjs(day).format(PICKER_DISPLAY_FORMAT);
}
