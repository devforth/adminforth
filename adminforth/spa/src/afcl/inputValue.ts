// Number('') is 0, so an emptied field would store a real zero
export function numberInputValue(raw: string | undefined | null): number | null {
  if (raw == null || raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}
