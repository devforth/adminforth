import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');

// resolves to the BUILT package (adminforth/dist) the test application runs on;
// rebuild it (`npx tsc` in adminforth/) after editing configValidator or the assertions below test stale code
const require = createRequire(import.meta.url);
const adminforthEntry = require.resolve('adminforth', { paths: [applicationDir] });
const { default: AdminForth } = await import(pathToFileURL(adminforthEntry).href);

function appWithPkColumn(pkColumn: Record<string, unknown>) {
  // AdminForth allows one instance per process; each test needs a fresh one
  delete (globalThis as any).adminforth;
  return new AdminForth({
    baseUrl: '',
    auth: {
      usersResourceId: 'adminuser',
      usernameField: 'email',
      passwordHashField: 'password_hash',
    },
    dataSources: [{ id: 'sqlite', url: `sqlite://${path.join(applicationDir, '.db.sqlite')}` }],
    resources: [{
      resourceId: 'adminuser',
      table: 'adminuser',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true, ...pkColumn },
        { name: 'email', required: true },
        { name: 'password_hash', backendOnly: true },
      ],
    }],
    menu: [{ label: 'Users', resourceId: 'adminuser' }],
  });
}

const pkBackendOnlyError = /column "id" is a primary key and cannot be backendOnly/;

describe('primary key column cannot be backendOnly', () => {
  it('rejects backendOnly: true on the primary key', () => {
    expect(() => appWithPkColumn({ backendOnly: true })).toThrow(pkBackendOnlyError);
  });

  it('rejects backendOnly function on the primary key', () => {
    expect(() => appWithPkColumn({ backendOnly: () => false })).toThrow(pkBackendOnlyError);
  });

  it('accepts backendOnly: false on the primary key and backendOnly on other columns', () => {
    expect(() => appWithPkColumn({ backendOnly: false })).not.toThrow();
    expect(() => appWithPkColumn({})).not.toThrow();
  });
});
