import { randomUUID } from 'node:crypto';
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
const { default: AdminForth, Filters } = await import(pathToFileURL(adminforthEntry).href);

const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'af-record-validation-'));
const dbPath = path.join(fixtureDir, 'db.sqlite');
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL);
  CREATE TABLE items (id TEXT PRIMARY KEY, title TEXT, kind TEXT, note TEXT, qty INTEGER, tags TEXT, code TEXT);
`);
db.close();

process.env.ADMINFORTH_SECRET ??= 'x'.repeat(64);

const adminUser = { pk: '1', username: 'admin@example.test', dbUser: {} };

// AdminForth allows one instance per process
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
        { name: 'id' },
        { name: 'email' },
        { name: 'password_hash', backendOnly: true },
      ],
    },
    {
      resourceId: 'items',
      table: 'items',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true, fillOnCreate: () => randomUUID(), showIn: { create: false, edit: false } },
        { name: 'title', required: true, minLength: 3, maxLength: 10 },
        { name: 'kind', enum: [{ value: 'plain', label: 'Plain' }, { value: 'noted', label: 'Noted' }] },
        { name: 'note', required: true, showIf: { kind: 'noted' } },
        { name: 'qty', type: AdminForth.Types.INTEGER, minValue: 1, maxValue: 100 },
        {
          name: 'tags',
          type: AdminForth.Types.JSON,
          isArray: { enabled: true, itemType: AdminForth.Types.STRING },
          maxLength: 5,
        },
        {
          name: 'code',
          enforceLowerCase: true,
          validation: [{
            validator: (value: string, record: any) => (value === record.title
              ? { isValid: false, message: 'Code must differ from title' }
              : { isValid: true }),
          }],
        },
      ],
    },
  ],
  menu: [{ label: 'Items', resourceId: 'items' }],
});
await app.discoverDatabases();

const endpoints: any[] = [];
app.restApi.registerEndpoints({ endpoint: (config: any) => endpoints.push(config) });

function callEndpoint(endpointPath: string, body: Record<string, unknown>) {
  const { handler } = endpoints.find((endpoint) => endpoint.path === endpointPath);
  return handler({ body, adminUser, headers: {}, query: {}, cookies: {}, requestUrl: endpointPath, response: {} });
}

const createItem = (record: Record<string, unknown>) => callEndpoint('/create_record', { resourceId: 'items', record });
const updateItem = (recordId: string, record: Record<string, unknown>) => callEndpoint('/update_record', { resourceId: 'items', recordId, record });

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe('POST /create_record', () => {
  it.each([
    ['missing', {}],
    ['null', { title: null }],
    ['empty string', { title: '' }],
  ])('rejects a %s required value', async (_, record) => {
    const res = await createItem(record);
    expect(res.error).toBe("Column 'title' is required");
  });

  it('requires a column only while its showIf matches', async () => {
    expect((await createItem({ title: 'abc', kind: 'plain' })).error).toBeUndefined();
    expect((await createItem({ title: 'abc', kind: 'noted' })).error).toBe("Column 'note' is required");
  });

  it('ignores required columns the client asks to skip', async () => {
    const res = await callEndpoint('/create_record', {
      resourceId: 'items',
      record: { title: 'abc', kind: 'noted' },
      requiredColumnsToSkip: [{ name: 'note' }],
    });
    expect(res.error).toBe("Column 'note' is required");
  });

  it.each([
    ['too short string', { title: 'ab' }, 'Value in "title" must not be shorter than 3 characters'],
    ['too long string', { title: 'a'.repeat(11) }, 'Value in "title" must not be longer than 10 characters'],
    ['value out of enum', { kind: 'other' }, 'Value in "kind" must be one of: plain, noted'],
    ['zero below minValue', { qty: 0 }, 'Value in "qty" must be greater than 1'],
    ['value above maxValue', { qty: 101 }, 'Value in "qty" must be less than 100'],
    ['array with duplicates', { tags: ['a', 'a'] }, 'Array in "tags" cannot contain duplicate items'],
    ['array with an empty item', { tags: ['a', ''] }, 'Array in "tags" cannot contain empty items'],
    ['array item longer than maxLength', { tags: ['toolong'] }, 'Value in "tags" must not be longer than 5 characters'],
    ['value rejected by custom validator', { title: 'abc', code: 'ABC' }, 'Code must differ from title'],
  ])('rejects %s', async (_, values, error) => {
    const res = await createItem({ title: 'abc', ...values });
    expect(res.error).toBe(error);
  });

  it('stores enforceLowerCase columns in lower case', async () => {
    const res = await createItem({ title: 'abc', code: 'MiXeD' });
    expect(res.error).toBeUndefined();

    const created = await app.resource('items').get([Filters.EQ('id', res.newRecordId)]);
    expect(created.code).toBe('mixed');
  });
});

describe('POST /update_record', () => {
  let recordId: string;

  beforeEach(async () => {
    ({ newRecordId: recordId } = await createItem({ title: 'abc', kind: 'noted', note: 'some note' }));
  });

  it('rejects clearing a required value', async () => {
    expect((await updateItem(recordId, { title: '' })).error).toBe("Column 'title' is required");
  });

  it('checks showIf of a required column against the record after the edit', async () => {
    expect((await updateItem(recordId, { note: '' })).error).toBe("Column 'note' is required");
    expect((await updateItem(recordId, { kind: 'plain', note: '' })).error).toBeUndefined();
  });

  it('rejects a value out of enum', async () => {
    expect((await updateItem(recordId, { kind: 'other' })).error).toBe('Value in "kind" must be one of: plain, noted');
  });

  it('passes the whole record to custom validators', async () => {
    expect((await updateItem(recordId, { code: 'abc' })).error).toBe('Code must differ from title');
  });
});

describe('createResourceRecord', () => {
  it('runs custom validators for records created from code', async () => {
    const resource = app.config.resources.find((res: any) => res.resourceId === 'items');
    const res = await app.createResourceRecord({ resource, record: { title: 'abc', code: 'abc' }, adminUser });
    expect(res.error).toBe('Code must differ from title');
  });
});
