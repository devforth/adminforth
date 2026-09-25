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

it('checks delete permission before reporting that a REST record is missing', async () => {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    options: { allowedActions: { delete: false } },
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

  expect(result).toEqual({ error: 'Action is not allowed' });
});

it('checks edit permission before reporting that a REST record is missing', async () => {
  const endpoints: Record<string, any> = {};
  const resource = {
    resourceId: 'items',
    dataSource: 'main',
    options: { allowedActions: { edit: false } },
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

  expect(result).toEqual({ error: 'Action is not allowed' });
});
