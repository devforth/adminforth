import AdminForthRestAPI from '../../adminforth/modules/restApi.js';

it('does not report a successful REST deletion when the row is outside user scope', async () => {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    options: { allowedActions: { delete: true } },
  };
  const adminforth = {
    config: { auth: { rateLimit: [] }, resources: [resource] },
    activatedPlugins: [],
    connectors: { main: { getRecordByPrimaryKey: async () => ({ id: 'item-1' }) } },
    resource: () => ({ asUser: () => ({ delete: async () => false }) }),
  } as any;
  new AdminForthRestAPI(adminforth).registerEndpoints({
    endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; },
  } as any);

  const result = await endpoints['/delete_record'].handler({
    body: { resourceId: 'items', primaryKey: 'item-1' },
    adminUser: {},
    query: {},
    headers: {},
    cookies: [],
    requestUrl: '',
    response: {},
  });

  expect(result).toEqual({ error: 'Record with item-1 not found' });
});

it('reports a missing REST delete target without calling the record-based delete permission', async () => {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    options: { allowedActions: { delete: ({ meta }) => meta.record.owner === 'me' } },
  };
  const adminforth = {
    config: { auth: { rateLimit: [] }, resources: [resource] },
    activatedPlugins: [],
    connectors: { main: { getRecordByPrimaryKey: async () => null } },
  } as any;
  new AdminForthRestAPI(adminforth).registerEndpoints({
    endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; },
  } as any);

  const result = await endpoints['/delete_record'].handler({
    body: { resourceId: 'items', primaryKey: 'missing' },
    adminUser: {}, query: {}, headers: {}, cookies: [], requestUrl: '', response: {},
  });

  expect(result).toEqual({ error: 'Record with missing not found' });
});

it('reports a missing REST update target without calling the record-based edit permission', async () => {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    columns: [{ name: 'id', primaryKey: true }],
    options: { allowedActions: { edit: ({ meta }) => meta.oldRecord.owner === 'me' } },
  };
  const adminforth = {
    config: { auth: { rateLimit: [] }, resources: [resource] },
    activatedPlugins: [],
    connectors: { main: { getRecordByPrimaryKey: async () => null } },
  } as any;
  new AdminForthRestAPI(adminforth).registerEndpoints({
    endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; },
  } as any);

  const result = await endpoints['/update_record'].handler({
    body: { resourceId: 'items', recordId: 'missing', record: { name: 'Jane' } },
    adminUser: {}, query: {}, headers: {}, cookies: [], requestUrl: '', response: {},
  });

  expect(result).toEqual({ error: 'Record with id missing not found' });
});
