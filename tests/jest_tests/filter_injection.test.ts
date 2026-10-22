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

const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'af-filter-injection-'));
const dbPath = path.join(fixtureDir, 'db.sqlite');
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);
  INSERT INTO users VALUES (1, 'a@example.test');
  INSERT INTO users VALUES (2, 'b@example.test');
  CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
  INSERT INTO posts VALUES (1, 'hello');
  -- comments.record_id is a polymorphic foreign key, so it makes both users and posts
  -- polymorphic targets (the same shape the audit-log plugin produces for every resource)
  CREATE TABLE comments (id INTEGER PRIMARY KEY, record_type TEXT NOT NULL, record_id TEXT NOT NULL);
`);
db.close();

process.env.ADMINFORTH_SECRET ??= 'x'.repeat(64);

delete (globalThis as any).adminforth;
const app = new AdminForth({
  baseUrl: '',
  auth: {
    usersResourceId: 'users',
    usernameField: 'email',
    passwordHashField: 'email',
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
      ],
    },
    {
      resourceId: 'posts',
      table: 'posts',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'title' },
      ],
    },
    {
      resourceId: 'comments',
      table: 'comments',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'record_type', showIn: { create: false, edit: false } },
        {
          name: 'record_id',
          foreignResource: {
            polymorphicOn: 'record_type',
            polymorphicResources: [
              { resourceId: 'users', whenValue: 'users' },
              { resourceId: 'posts', whenValue: 'posts' },
            ],
          },
        },
      ],
    },
  ],
  menu: [{ label: 'Users', resourceId: 'users' }],
});
await app.discoverDatabases();

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

// users is a polymorphic target (via comments.record_id), so it goes through the relaxed field check
const usersResource = () => app.config.resources.find((r: any) => r.resourceId === 'users');
const connector = () => (app as any).connectors.sqlite;

describe('filter injection hardening', () => {
  describe('field names are not passed through unchecked on a polymorphic target', () => {
    it.each([
      ['a $-prefixed operator name', '$where'],
      ['a $-prefixed comment', '$comment'],
      ['a SQL identifier break', 'email" = "email'],
      ['a truly unknown field', 'definitely_not_a_column'],
    ])('rejects %s', (_, field) => {
      expect(() => connector().validateAndNormalizeFilters({ field, operator: 'eq', value: 'x' }, usersResource())).toThrow();
    });

    it('still allows a column that exists on a sibling polymorphic target', () => {
      // `title` belongs to posts, not users, but both are targets of comments.record_id,
      // so filtering users by it must stay allowed (the reason the relaxed check exists)
      const result = connector().validateAndNormalizeFilters({ field: 'title', operator: 'eq', value: 'x' }, usersResource());
      expect(result.ok).toBe(true);
    });
  });
});
