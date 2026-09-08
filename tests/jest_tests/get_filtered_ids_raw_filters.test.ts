import { jest } from '@jest/globals';
import I18nPlugin from '../../plugins/adminforth-i18n/index.js';
import BulkAiFlowPlugin from '../../plugins/adminforth-bulk-ai-flow/index.js';

type Handler = (input: Record<string, unknown>) => Promise<any>;
type Hook = (args: { query: any }) => Promise<{ ok: boolean }>;
type ListRule = boolean | string | ((ctx: any) => Promise<boolean | string>);

const ADMIN_USER = { dbUser: { role: 'superadmin' } };
const PERMISSION_DENIED = /not allowed to list/i;

function requestWith(filters: unknown) {
  return { body: { filters }, adminUser: ADMIN_USER, headers: {}, query: {}, cookies: [], requestUrl: '/x', response: {} };
}

function setUp(plugin: any, { listRule = true as ListRule, hooks = [] as Hook[] } = {}): { handler: Handler; list: jest.Mock } {
  const list = jest.fn(async () => [{ id: 1 }, { id: 2 }]);
  plugin.pluginInstanceId = 'test';
  plugin.adminforth = { resource: () => ({ list }) };
  plugin.resourceConfig = {
    resourceId: 'things',
    columns: [{ name: 'id', primaryKey: true }],
    options: { allowedActions: { list: listRule, show: true, edit: true, create: true, delete: true, filter: true } },
    hooks: { list: { beforeDatasourceRequest: hooks } },
  };

  const endpoints: Record<string, any> = {};
  plugin.setupEndpoints({ endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; } });
  return { handler: endpoints['/plugin/test/get_filtered_ids'].handler, list };
}

const PLUGINS: Array<[string, () => any]> = [
  ['i18n', () => new I18nPlugin({ supportedLanguages: ['en'], translationFieldNames: { en: 'en_string' } } as any)],
  ['bulk-ai-flow', () => new BulkAiFlowPlugin({} as any)],
];

const ID_FILTER = { field: 'id', operator: 'eq', value: 1 };

const RAW_NODES: Array<[string, unknown]> = [
  ['a raw SQL node in the filter array', [{ insecureRawSQL: '1=1 OR 1=1' }]],
  ['a raw NoSQL node in the filter array', [{ insecureRawNoSQL: { $where: 'true' } }]],
  ['a raw SQL node nested inside an and/or group', { operator: 'or', subFilters: [ID_FILTER, { insecureRawSQL: '1=1' }] }],
  ['a single raw SQL node object', { insecureRawSQL: "(SELECT password_hash FROM adminuser LIMIT 1) LIKE 'a%'" }],
];

const ORDINARY_SHAPES: Array<[string, unknown, unknown]> = [
  ['an array of filters', [ID_FILTER], { operator: 'and', subFilters: [ID_FILTER] }],
  ['a single filter object', ID_FILTER, { operator: 'and', subFilters: [ID_FILTER] }],
  ['an and/or group', { operator: 'or', subFilters: [ID_FILTER, { field: 'id', operator: 'eq', value: 2 }] }, { operator: 'or', subFilters: [ID_FILTER, { field: 'id', operator: 'eq', value: 2 }] }],
];

describe.each(PLUGINS)('%s get_filtered_ids', (_name, makePlugin) => {
  it.each(RAW_NODES)('rejects %s without consulting permissions or the data source', async (_label, filters) => {
    const listRule = jest.fn(async () => true);
    const { handler, list } = setUp(makePlugin(), { listRule });

    const result = await handler(requestWith(filters));

    expect(result.error).toEqual(expect.any(String));
    expect(result.error).not.toMatch(PERMISSION_DENIED);
    expect(result.recordIds).toBeUndefined();
    expect(listRule).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it.each([
    ['a boolean denial', false, PERMISSION_DENIED],
    ['a string denial, passed through as the message', 'Only tenant admins may list things', /^Only tenant admins may list things$/],
  ])('refuses a user who may not list the resource (%s) before touching the data source', async (_label, listRule, expectedError) => {
    const { handler, list } = setUp(makePlugin(), { listRule: listRule as ListRule });

    const result = await handler(requestWith([ID_FILTER]));

    expect(result.error).toMatch(expectedError);
    expect(result.recordIds).toBeUndefined();
    expect(list).not.toHaveBeenCalled();
  });

  it('evaluates a function-valued list rule as a list request carrying the client filters', async () => {
    const listRule = jest.fn(async () => true);
    const { handler, list } = setUp(makePlugin(), { listRule });

    await handler(requestWith([ID_FILTER]));

    expect(listRule).toHaveBeenCalledTimes(1);
    expect(listRule).toHaveBeenCalledWith(expect.objectContaining({
      adminUser: ADMIN_USER,
      source: 'listRequest',
      meta: expect.objectContaining({ requestBody: expect.objectContaining({ filters: [ID_FILTER] }) }),
    }));
    expect(list).toHaveBeenCalledTimes(1);
  });

  it.each(ORDINARY_SHAPES)('passes %s through to the data source normalised', async (_label, filters, expected) => {
    const { handler, list } = setUp(makePlugin());

    const result = await handler(requestWith(filters));

    expect(list).toHaveBeenCalledWith(expected);
    expect(result).toEqual({ ok: true, recordIds: [1, 2] });
  });

  it('still lets a server-side hook add a raw scoping filter after the client filters were checked', async () => {
    const tenantScope = { insecureRawSQL: 'tenant_id = 1' };
    const hook: Hook = async ({ query }) => { query.filters.push(tenantScope); return { ok: true }; };
    const { handler, list } = setUp(makePlugin(), { hooks: [hook] });

    const result = await handler(requestWith([ID_FILTER]));

    expect(list).toHaveBeenCalledWith({ operator: 'and', subFilters: [ID_FILTER, tenantScope] });
    expect(result).toEqual({ ok: true, recordIds: [1, 2] });
  });
});
