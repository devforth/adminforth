import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');

// resolves to the BUILT package (adminforth/dist) the test application runs on;
// rebuild it (`npx tsc` in adminforth/) after editing adminforth sources or the assertions below test stale code
const require = createRequire(import.meta.url);
// jest's resolver does not know the `node:sqlite` builtin, so it is required directly
const { DatabaseSync } = require('node:sqlite');
const adminforthEntry = require.resolve('adminforth', { paths: [applicationDir] });
const { default: AdminForth } = await import(pathToFileURL(adminforthEntry).href);

const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'af-aggregate-hooks-'));
const dbPath = path.join(fixtureDir, 'db.sqlite');
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL);
  CREATE TABLE orders (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, amount INTEGER NOT NULL);
  INSERT INTO orders VALUES (1, 'alice', 10);
  INSERT INTO orders VALUES (2, 'alice', 20);
  INSERT INTO orders VALUES (3, 'bob', 5);
`);
db.close();

process.env.ADMINFORTH_SECRET ??= 'x'.repeat(64);

const afterHookCalls: { query: any, response: any }[] = [];

delete (globalThis as any).adminforth;
const app = new AdminForth({
  baseUrl: '',
  auth: {
    usersResourceId: 'users',
    usernameField: 'email',
    passwordHashField: 'password_hash',
  },
  dataSources: [{ id: 'sqlite', url: `sqlite://${dbPath}` }],
  resources: [
    {
      resourceId: 'users',
      table: 'users',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'email' },
        { name: 'password_hash', backendOnly: true },
      ],
    },
    {
      resourceId: 'orders',
      table: 'orders',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'owner' },
        { name: 'amount' },
      ],
      hooks: {
        list: {
          beforeDatasourceRequest: async ({ query, adminUser }) => {
            if (adminUser.dbUser.role === 'blocked') {
              return { ok: false, error: 'Blocked by hook' };
            }
            if (adminUser.dbUser.role !== 'superadmin') {
              query.filtersTools.replaceOrAddTopFilter({ field: 'owner', operator: 'eq', value: adminUser.username });
            }
            return { ok: true };
          },
          afterDatasourceResponse: async ({ query, response }) => {
            afterHookCalls.push({ query, response });
            if (query.aggregations) {
              for (const row of response) {
                row.currency = 'USD';
              }
            }
            return { ok: true };
          },
        },
      },
    },
  ],
  menu: [{ label: 'Orders', resourceId: 'orders' }],
});
await app.discoverDatabases();

const endpoints: any[] = [];
app.restApi.registerEndpoints({ endpoint: (config: any) => endpoints.push(config) });

beforeEach(() => {
  afterHookCalls.length = 0;
});

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

function aggregate(body: Record<string, unknown>, username: string, role = 'admin') {
  const { handler } = endpoints.find((endpoint) => endpoint.path === '/aggregate');
  return handler({
    body: { resourceId: 'orders', ...body },
    adminUser: { pk: '1', username, dbUser: { role } },
    headers: {},
    query: {},
    cookies: {},
    requestUrl: '/aggregate',
    abortSignal: new AbortController().signal,
  });
}

const totals = { aggregations: { orders: { operation: 'count' }, revenue: { operation: 'sum', field: 'amount' } } };

describe('aggregate list hooks', () => {
  it('scopes rows with filters added by list.beforeDatasourceRequest', async () => {
    expect((await aggregate(totals, 'alice')).data).toEqual([
      { orders: 2, revenue: 30, currency: 'USD' },
    ]);
    expect((await aggregate(totals, 'root', 'superadmin')).data).toEqual([
      { orders: 3, revenue: 35, currency: 'USD' },
    ]);
  });

  it('applies hook filters on top of the request filters and groupBy', async () => {
    const result = await aggregate({
      ...totals,
      filters: [{ field: 'amount', operator: 'gt', value: 10 }],
      groupBy: { type: 'field', field: 'owner', as: 'owner' },
    }, 'alice');
    expect(result.data).toEqual([{ owner: 'alice', orders: 1, revenue: 20, currency: 'USD' }]);
  });

  it('stops when list.beforeDatasourceRequest returns an error', async () => {
    expect(await aggregate(totals, 'alice', 'blocked')).toEqual({ error: 'Blocked by hook' });
    expect(afterHookCalls).toEqual([]);
  });

  it('passes the request and the aggregation rows to list.afterDatasourceResponse', async () => {
    await aggregate(totals, 'bob');
    expect(afterHookCalls).toEqual([{
      query: expect.objectContaining({ aggregations: totals.aggregations }),
      response: [{ orders: 1, revenue: 5, currency: 'USD' }],
    }]);
  });
});
