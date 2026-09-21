// new Date(null) is the Unix epoch, so an empty column used to render as "57 years ago"
export function parseRelativeTimeValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}
