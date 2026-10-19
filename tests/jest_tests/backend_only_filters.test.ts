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

const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'af-backend-only-filters-'));
const dbPath = path.join(fixtureDir, 'db.sqlite');
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL, last_ip TEXT NOT NULL);
  INSERT INTO users VALUES (1, 'a@example.test', 'hash-a', '10.0.0.1');
  INSERT INTO users VALUES (2, 'b@example.test', 'hash-b', '10.0.0.2');
  CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL);
  INSERT INTO posts VALUES (1, 1);
`);
db.close();

process.env.ADMINFORTH_SECRET ??= 'x'.repeat(64);

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
        // hidden by role, like PII which only some admins may read
        { name: 'last_ip', backendOnly: ({ adminUser }) => adminUser.dbUser.role !== 'superadmin' },
      ],
      hooks: {
        list: {
          // server code may still filter by hidden columns
          beforeDatasourceRequest: async ({ query }) => {
            if (query.hookFilter) {
              query.filters.push({ field: 'password_hash', operator: 'eq', value: 'hash-b' });
            }
            return { ok: true };
          },
        },
      },
    },
    {
      resourceId: 'posts',
      table: 'posts',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'user_id', foreignResource: { resourceId: 'users' } },
      ],
    },
  ],
  menu: [{ label: 'Users', resourceId: 'users' }],
});
await app.discoverDatabases();

const endpoints: any[] = [];
app.restApi.registerEndpoints({ endpoint: (config: any) => endpoints.push(config) });

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

function call(endpointPath: string, body: Record<string, unknown>, role = 'admin') {
  const { handler } = endpoints.find((endpoint) => endpoint.path === endpointPath);
  return handler({
    body,
    adminUser: { pk: '1', username: 'a@example.test', dbUser: { role } },
    headers: {},
    query: {},
    cookies: {},
    requestUrl: endpointPath,
    abortSignal: new AbortController().signal,
  });
}

const listUsers = (filters: unknown, extra: Record<string, unknown> = {}, role?: string) =>
  call('/get_resource_data', { resourceId: 'users', source: 'list', limit: 10, offset: 0, sort: [], filters, ...extra }, role);

const passwordHashFilter = { field: 'password_hash', operator: 'ilike', value: 'hash-a%' };
const passwordHashError = { error: 'Filter: column "password_hash" cannot be used (backendOnly is true).' };

describe('filters on backendOnly columns', () => {
  it.each([
    ['top level', [passwordHashFilter]],
    ['single filter object', passwordHashFilter],
    ['nested in or', { operator: 'and', subFilters: [{ operator: 'or', subFilters: [{ field: 'email', operator: 'eq', value: 'x' }, passwordHashFilter] }] }],
    ['compared as rightField', [{ field: 'email', operator: 'eq', rightField: 'password_hash' }]],
  ])('get_resource_data rejects them %s', async (_, filters) => {
    expect(await listUsers(filters)).toEqual(passwordHashError);
  });

  it('get_resource_data rejects them for show source', async () => {
    const result = await call('/get_resource_data', {
      resourceId: 'users', source: 'show', limit: 1, offset: 0, filters: [{ field: 'id', operator: 'eq', value: 1 }, passwordHashFilter],
    });
    expect(result).toEqual(passwordHashError);
  });

  it('get_resource_data keeps filters on readable columns', async () => {
    const result = await listUsers([{ field: 'email', operator: 'eq', value: 'b@example.test' }]);
    expect(result.data).toEqual([expect.objectContaining({ id: 2, email: 'b@example.test' })]);
  });

  it('get_resource_data resolves role based backendOnly per user', async () => {
    const lastIpFilter = [{ field: 'last_ip', operator: 'eq', value: '10.0.0.2' }];
    expect(await listUsers(lastIpFilter)).toEqual({ error: 'Filter: column "last_ip" cannot be used (backendOnly is true).' });

    const result = await listUsers(lastIpFilter, {}, 'superadmin');
    expect(result.data).toEqual([expect.objectContaining({ id: 2, last_ip: '10.0.0.2' })]);
  });

  it('get_resource_data applies backendOnly filters added by hooks', async () => {
    const result = await listUsers([], { hookFilter: true });
    expect(result.data).toEqual([expect.objectContaining({ id: 2 })]);
    expect(result.data[0]).not.toHaveProperty('password_hash');
  });

  it('get_resource_foreign_data rejects them on the target resource', async () => {
    const result = await call('/get_resource_foreign_data', {
      resourceId: 'posts', column: 'user_id', limit: 10, offset: 0, filters: [passwordHashFilter],
    });
    expect(result).toEqual(passwordHashError);
  });

  it('aggregate rejects them', async () => {
    const result = await call('/aggregate', {
      resourceId: 'users', aggregations: { total: { operation: 'count' } }, filters: [passwordHashFilter],
    });
    expect(result).toEqual(passwordHashError);
  });
});
