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

// own fixture, so the primary key is discovered from a known schema
const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'af-pk-backend-only-'));
const dbPath = path.join(fixtureDir, 'db.sqlite');
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL);
  INSERT INTO users VALUES (1, 'pk@example.test', 'hidden');
`);
db.close();

process.env.ADMINFORTH_SECRET ??= 'x'.repeat(64);

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

// constructor validation and database discovery together, as on real startup
async function startApp(idColumn: Record<string, unknown>) {
  // AdminForth allows one instance per process; each test needs a fresh one
  delete (globalThis as any).adminforth;
  const app = new AdminForth({
    baseUrl: '',
    auth: {
      usersResourceId: 'users',
      usernameField: 'email',
      passwordHashField: 'password_hash',
    },
    dataSources: [{ id: 'sqlite', url: `sqlite://${dbPath}` }],
    resources: [{
      resourceId: 'users',
      table: 'users',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', ...idColumn },
        { name: 'email' },
        { name: 'password_hash', backendOnly: true },
      ],
    }],
    menu: [{ label: 'Users', resourceId: 'users' }],
  });
  await app.discoverDatabases();
  return app;
}

async function listUsers(app: any) {
  const endpoints: any[] = [];
  app.restApi.registerEndpoints({ endpoint: (config: any) => endpoints.push(config) });
  const { handler } = endpoints.find((endpoint) => endpoint.path === '/get_resource_data');
  return handler({
    body: { resourceId: 'users', source: 'list', limit: 10, offset: 0, filters: [], sort: [] },
    adminUser: { pk: '1', username: 'pk@example.test', dbUser: {} },
    headers: {},
    query: {},
    cookies: {},
    requestUrl: '/get_resource_data',
    abortSignal: new AbortController().signal,
  });
}

const pkBackendOnlyError = /column "id" is a primary key and cannot be backendOnly/;

// `primaryKey` is omitted, not set to undefined: undefined would override the discovered value on merge
describe.each([
  ['declared', { primaryKey: true }],
  ['discovered from database', {}],
])('%s primary key', (_, pkFlag) => {
  it.each([
    ['true', true],
    ['function returning true', () => true],
    ['function returning false', () => false],
  ])('rejects startup with backendOnly %s', async (_, backendOnly) => {
    await expect(startApp({ ...pkFlag, backendOnly })).rejects.toThrow(pkBackendOnlyError);
  });

  it.each([
    ['false', { backendOnly: false }],
    ['omitted', {}],
  ])('starts with backendOnly %s and keeps the id in list rows', async (_, backendOnlyFlag) => {
    const app = await startApp({ ...pkFlag, ...backendOnlyFlag });
    const result = await listUsers(app);

    expect(result.data).toEqual([expect.objectContaining({ id: 1, email: 'pk@example.test' })]);
    expect(result.recordIds).toEqual([1]);
    // non-primary-key backendOnly column stays allowed and hidden
    expect(result.data[0]).not.toHaveProperty('password_hash');
  });
});
