import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');

// resolves to the BUILT package (adminforth/dist) the test application runs on;
// rebuild it (`npx tsc` in adminforth/) after editing the validator or the assertions below test stale code
const require = createRequire(import.meta.url);
const adminforthEntry = require.resolve('adminforth', { paths: [applicationDir] });
const { default: AdminForth } = await import(pathToFileURL(adminforthEntry).href);

function appWithDefaultFilters(defaultFilters: any[]) {
  // AdminForth allows one instance per process; each test needs a fresh one
  delete (globalThis as any).adminforth;
  return new AdminForth({
    baseUrl: '',
    auth: {
      usersResourceId: 'adminuser',
      usernameField: 'email',
      passwordHashField: 'password_hash',
    },
    dataSources: [{ id: 'sqlite', url: 'sqlite://unused.sqlite' }],
    resources: [{
      resourceId: 'adminuser',
      table: 'adminuser',
      dataSource: 'sqlite',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'email', required: true },
        { name: 'password_hash', backendOnly: true },
        { name: 'role' },
      ],
      options: { defaultFilters },
    }],
    menu: [{ label: 'Users', resourceId: 'adminuser' }],
  });
}

describe('options.defaultFilters validation', () => {
  it('accepts valid default filters', () => {
    expect(() => appWithDefaultFilters([{ field: 'role', operator: 'in', value: ['admin'] }])).not.toThrow();
  });

  it('rejects an unknown field with a suggestion', () => {
    expect(() => appWithDefaultFilters([{ field: 'rol', operator: 'in', value: ['admin'] }]))
      .toThrow(/defaultFilters field "rol" not found in columns\. Did you mean "role"\?/);
  });

  it('rejects an unknown operator', () => {
    expect(() => appWithDefaultFilters([{ field: 'role', operator: 'between', value: ['admin'] }]))
      .toThrow(/defaultFilters operator "between" is invalid/);
  });
});
