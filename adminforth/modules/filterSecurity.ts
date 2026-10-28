function hasApiRawFilter(filters: any): boolean {
  if (!filters || typeof filters !== 'object') {
    return false;
  }

  if (Array.isArray(filters)) {
    return filters.some(hasApiRawFilter);
  }

  if (
    Object.prototype.hasOwnProperty.call(filters, 'insecureRawSQL') ||
    Object.prototype.hasOwnProperty.call(filters, 'insecureRawNoSQL')
  ) {
    return true;
  }

  return Array.isArray(filters.subFilters) && filters.subFilters.some(hasApiRawFilter);
}

/** Reject raw connector expressions supplied by an API caller, before hooks may add trusted ones. */
export function rejectApiRawFilters(filters: any): { error: string } | undefined {
  if (hasApiRawFilter(filters)) {
    return { error: 'insecureRawSQL and insecureRawNoSQL filters are not allowed in API requests' };
  }
}
