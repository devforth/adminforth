import { jest } from '@jest/globals';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');
const sqliteDbPath = path.join(applicationDir, '.db.sqlite');

// same env the application harness uses; only the DB schema is needed here, not the app
process.env.SQLITE_URL ??= `sqlite://${sqliteDbPath}`;
process.env.SQLITE_FILE_URL ??= `file:${sqliteDbPath}`;
process.env.NODE_ENV ??= 'test';
await execFileAsync('pnpm', ['migrate:local'], { cwd: applicationDir, env: process.env });

// resolves to the BUILT package (adminforth/dist) the test application runs on;
// rebuild it (`npx tsc` in adminforth/) after editing adminforth/index.ts or the assertions below test stale code
const require = createRequire(import.meta.url);
const adminforthEntry = require.resolve('adminforth', { paths: [applicationDir] });
const { default: AdminForth, afLogger } = await import(pathToFileURL(adminforthEntry).href);

const savedSecret = process.env.ADMINFORTH_SECRET;

function minimalApp() {
  // AdminForth allows one instance per process; each test needs a fresh one
  delete (globalThis as any).adminforth;
  return new AdminForth({
    baseUrl: '',
    auth: {
      usersResourceId: 'adminuser',
      usernameField: 'email',
      passwordHashField: 'password_hash',
    },
    dataSources: [{ id: 'sqlite', url: process.env.SQLITE_URL }],
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
    }],
    menu: [{ label: 'Users', resourceId: 'adminuser' }],
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  if (savedSecret === undefined) {
    delete process.env.ADMINFORTH_SECRET;
  } else {
    process.env.ADMINFORTH_SECRET = savedSecret;
  }
});

const spyWarn = () => jest.spyOn(afLogger, 'warn').mockImplementation(() => undefined);
const tooShort = expect.stringMatching(/too short/);

describe('ADMINFORTH_SECRET strength check', () => {
  it('still starts with a secret shorter than 16 characters, but warns', async () => {
    process.env.ADMINFORTH_SECRET = '123';
    const warn = spyWarn();

    await expect(minimalApp().discoverDatabases()).resolves.not.toThrow();
    expect(warn).toHaveBeenCalledWith(tooShort);
  });

  it('warns at 15 characters and not at 16', async () => {
    process.env.ADMINFORTH_SECRET = 'x'.repeat(15);
    const warnAt15 = spyWarn();
    await minimalApp().discoverDatabases();
    expect(warnAt15).toHaveBeenCalledWith(tooShort);
    jest.restoreAllMocks();

    process.env.ADMINFORTH_SECRET = 'x'.repeat(16);
    const warnAt16 = spyWarn();
    await minimalApp().discoverDatabases();
    expect(warnAt16).not.toHaveBeenCalledWith(tooShort);
  });

  it('starts silently with a 32-byte hex secret', async () => {
    process.env.ADMINFORTH_SECRET = 'a'.repeat(64);
    const warn = spyWarn();

    await expect(minimalApp().discoverDatabases()).resolves.not.toThrow();
    expect(warn).not.toHaveBeenCalledWith(tooShort);
  });
});
