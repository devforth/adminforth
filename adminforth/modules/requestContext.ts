import { AsyncLocalStorage } from 'async_hooks';

export const ADMINFORTH_CLIENT_ID_HEADER = 'x-adminforth-client-id';

export type AdminForthRequestContext = {
  websocketClientId?: string;
};

const requestContextStorage = new AsyncLocalStorage<AdminForthRequestContext>();

export function runWithRequestContext<T>(context: AdminForthRequestContext, callback: () => T): T {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext(): AdminForthRequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getRequestWebsocketClientId(): string | undefined {
  return requestContextStorage.getStore()?.websocketClientId;
}
