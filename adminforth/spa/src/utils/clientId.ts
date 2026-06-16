const ADMINFORTH_CLIENT_ID_STORAGE_KEY = 'adminforthClientId';

export const ADMINFORTH_CLIENT_ID_HEADER = 'x-adminforth-client-id';

export function getAdminForthClientId(): string {
  const existingClientId = sessionStorage.getItem(ADMINFORTH_CLIENT_ID_STORAGE_KEY);
  if (existingClientId) {
    return existingClientId;
  }

  const clientId = crypto.randomUUID();
  sessionStorage.setItem(ADMINFORTH_CLIENT_ID_STORAGE_KEY, clientId);
  return clientId;
}
