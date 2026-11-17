import { jest } from '@jest/globals';
import AdminForthRestAPI from '../../adminforth/modules/restApi.js';

function setup({ visibleCount, action }: { visibleCount: number, action: any }) {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    columns: [{ name: 'id', primaryKey: true }],
    options: { allowedActions: {}, actions: [{ id: 'act', name: 'Act', ...action }] },
  };
  const adminforth = {
    config: { auth: { rateLimit: [] }, resources: [resource] },
    activatedPlugins: [],
    connectors: {
      main: {
        getRecordByPrimaryKey: async (_resource: any, id: string) => ({ id, secret: 'hidden' }),
        getPrimaryKeyFilters: (_resource: any, id: string) => [{ field: 'id', operator: 'eq', value: id }],
      },
    },
    // stands for asUser(): the ACL and the row scope decide how many of the records the user can list
    resource: () => ({ asUser: () => ({ count: async () => visibleCount }) }),
  } as any;
  new AdminForthRestAPI(adminforth).registerEndpoints({
    endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; },
  } as any);
  return (path: string, body: any) => endpoints[path].handler({
    body, adminUser: {}, query: {}, headers: {}, cookies: [], requestUrl: '', response: {}, tr: async (message: string) => message,
  });
}

it('runs no action on a record the user can not list', async () => {
  const action = { action: jest.fn(async () => ({ ok: true })) };
  const call = setup({ visibleCount: 0, action });

  const result = await call('/start_custom_action', { resourceId: 'items', actionId: 'act', recordId: 'item-1' });

  expect(result).toEqual({ error: 'Record with item-1 not found' });
  expect(action.action).not.toHaveBeenCalled();
});

it('answers a url action with where to go, without the record which holds backendOnly columns', async () => {
  const action = { url: jest.fn(({ record }) => `/items/${record.id}`) };
  const call = setup({ visibleCount: 1, action });

  const result = await call('/start_custom_action', { resourceId: 'items', actionId: 'act', recordId: 'item-1' });

  expect(result).toEqual({ actionId: 'act', recordId: 'item-1', resourceId: 'items', redirectUrl: '/items/item-1' });
  // the url callback is server-side config, it still gets the full row
  expect(action.url).toHaveBeenCalledWith(expect.objectContaining({ record: { id: 'item-1', secret: 'hidden' } }));
});

it('runs no bulk action when one of the records is outside the user scope', async () => {
  const action = { bulkHandler: jest.fn(async () => ({ ok: true })) };
  const call = setup({ visibleCount: 1, action });

  const result = await call('/start_custom_bulk_action', { resourceId: 'items', actionId: 'act', recordIds: ['item-1', 'item-2'] });

  expect(result).toEqual({ error: 'Some of the selected records were not found' });
  expect(action.bulkHandler).not.toHaveBeenCalled();
});

it('runs a bulk action on records the user can list', async () => {
  const action = { bulkHandler: jest.fn(async () => ({ ok: true })) };
  const call = setup({ visibleCount: 2, action });

  const result = await call('/start_custom_bulk_action', { resourceId: 'items', actionId: 'act', recordIds: ['item-1', 'item-2'] });

  expect(result).toMatchObject({ ok: true });
  expect(action.bulkHandler).toHaveBeenCalledWith(expect.objectContaining({ recordIds: ['item-1', 'item-2'] }));
});
