import { jest } from '@jest/globals';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createAppDir = path.resolve(currentDir, '../../adminforth/commands/createApp');

// utils.js imports the CLI entry (cli.js), whose top-level command switch runs on import and
// whose import graph runs dotenv.config({ path: '.env' }) against the cwd; import it with no argv
// command, a muted console and an empty cwd so nothing dispatches, prints or leaks into process.env
const utils = await (async () => {
  const argv = process.argv;
  const log = console.log;
  const cwd = process.cwd();
  process.argv = argv.slice(0, 2);
  console.log = () => undefined;
  process.chdir(os.tmpdir());
  try {
    return await import('../../adminforth/commands/createApp/utils.js');
  } finally {
    process.chdir(cwd);
    process.argv = argv;
    console.log = log;
  }
})();
const { writeTemplateFiles, promptForMissingOptions, generateFinalInstructionsPnpm, generateFinalInstructionsNpm } = utils;

// The existing-database case needs (a) the sqlite connector the CLI itself will load and (b) a way
// to create a table in a sqlite file: better-sqlite3 through that connector (works on Node 20),
// else the node:sqlite builtin (Node >= 22.13). Without both the case is skipped, not failed.
const cliRequire = createRequire(path.join(createAppDir, 'utils.js'));
const sqliteDrivers: Array<(file: string, sql: string) => void> = [];
try {
  const Database = createRequire(cliRequire.resolve('@adminforth/connector-sqlite'))('better-sqlite3');
  sqliteDrivers.push((file, sql) => { const db = new Database(file); db.exec(sql); db.close(); });
} catch { /* connector or native binding unavailable */ }
try {
  const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
  sqliteDrivers.push((file, sql) => { const db = new DatabaseSync(file); db.exec(sql); db.close(); });
} catch { /* Node < 22.13 */ }
// a driver that loads but fails at use (e.g. a broken native binding) falls through to the next one
function createSqliteTable(file: string, sql: string) {
  let lastError: unknown;
  for (const driver of sqliteDrivers) {
    try { return driver(file, sql); } catch (error) { lastError = error; }
  }
  throw lastError ?? new Error('no sqlite driver available');
}
const connectorAvailable = (() => { try { cliRequire.resolve('@adminforth/connector-sqlite'); return true; } catch { return false; } })();
const itWithSqlite = sqliteDrivers.length && connectorAvailable ? it : it.skip;

const ADMINUSER_DDL = 'CREATE TABLE adminuser';
const ADMINUSER_SECTION = 'Create the admin users table';
// scaffolding asks the npm registry for the current version range (with an offline fallback)
const SCAFFOLD_TIMEOUT_MS = 30_000;
const tmpDirs: string[] = [];

const postgresOptions = {
  appName: 'existing-db-demo',
  dbUrl: 'postgresql://user:password@localhost:5432/dbname',
  dbUrlProd: 'postgresql://user:password@localhost:5432/dbname',
  prismaDbUrl: 'postgresql://user:password@localhost:5432/dbname',
  prismaDbUrlProd: 'postgresql://user:password@localhost:5432/dbname',
  provider: 'postgresql',
  nodeMajor: 22,
  sqliteFile: null,
};

const mongoOptions = {
  ...postgresOptions,
  dbUrl: 'mongodb://localhost:27017/dbname',
  dbUrlProd: 'mongodb://localhost:27017/dbname',
  prismaDbUrl: null,
  prismaDbUrlProd: null,
  provider: 'mongodb',
};

async function tmpDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'af-existing-db-'));
  tmpDirs.push(dir);
  return dir;
}

async function scaffoldReadme(includePrismaMigrations: boolean, options = postgresOptions): Promise<string> {
  const cwd = await tmpDir();
  await writeTemplateFiles(createAppDir, cwd, false, includePrismaMigrations, options);
  return fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
}

function spyLog() {
  return jest.spyOn(console, 'log').mockImplementation(() => undefined);
}

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await Promise.all(tmpDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('adminuser table instructions when Prisma will not manage the schema', () => {
  it('README carries the adminuser section and DDL when Prisma migrations were declined for an empty database', async () => {
    const readme = await scaffoldReadme(false);

    // the positive twin of the MongoDB check below, so that negative cannot pass on a reworded heading
    expect(readme).toContain(ADMINUSER_SECTION);
    expect(readme).toContain(ADMINUSER_DDL);
  }, SCAFFOLD_TIMEOUT_MS);

  it('README omits the DDL when Prisma migrations manage the schema', async () => {
    expect(await scaffoldReadme(true)).not.toContain(ADMINUSER_DDL);
  }, SCAFFOLD_TIMEOUT_MS);

  it('README has no adminuser section for MongoDB, which needs no table up front', async () => {
    const readme = await scaffoldReadme(false, mongoOptions);

    expect(readme).not.toContain(ADMINUSER_SECTION);
    expect(readme).not.toContain(ADMINUSER_DDL);
  }, SCAFFOLD_TIMEOUT_MS);

  it('final CLI instructions carry the DDL whenever Prisma setup is skipped, for both package managers', () => {
    const options = { appName: 'x', db: postgresOptions.dbUrl };

    expect(generateFinalInstructionsPnpm(true, options)).toContain(ADMINUSER_DDL);
    expect(generateFinalInstructionsNpm(true, options)).toContain(ADMINUSER_DDL);
    expect(generateFinalInstructionsPnpm(false, options)).not.toContain(ADMINUSER_DDL);
    expect(generateFinalInstructionsPnpm(true, { appName: 'x', db: mongoOptions.dbUrl })).not.toContain(ADMINUSER_DDL);
  });
});

describe('create-app database inspection', () => {
  it('treats a database that is not there yet as new and says so without asking a question it will not ask', async () => {
    const log = spyLog();
    const db = `sqlite://${path.join(await tmpDir(), 'missing.db')}`;

    const resolved = await promptForMissingOptions({ appName: 'x', db, useNpm: true, includePrismaMigrations: false });
    const printed = log.mock.calls.flat().join('\n');

    expect(resolved.existingDb).toBe(false);
    expect(resolved.dbInspected).toBe(true);
    expect(resolved.includePrismaMigrations).toBe(false);
    expect(printed).toMatch(/empty/i);
    expect(printed).toContain('adminuser');
    // includePrismaMigrations was preset, so no "Include Prisma migrations?" question follows
    expect(printed).not.toMatch(/answer (yes|no)/i);
  }, SCAFFOLD_TIMEOUT_MS);

  itWithSqlite('treats a database that already has tables as the user\'s own and skips Prisma', async () => {
    const log = spyLog();
    const file = path.join(await tmpDir(), 'owned.db');
    createSqliteTable(file, 'CREATE TABLE orders (id INTEGER PRIMARY KEY, total REAL)');

    const resolved = await promptForMissingOptions({ appName: 'x', db: `sqlite://${file}`, useNpm: true, includePrismaMigrations: true });
    const printed = log.mock.calls.flat().join('\n');

    expect(resolved.existingDb).toBe(true);
    expect(resolved.dbInspected).toBe(true);
    expect(resolved.includePrismaMigrations).toBe(false);
    expect(printed).toMatch(/already contains data/i);
    expect(printed).toContain('adminuser');
  }, SCAFFOLD_TIMEOUT_MS);
});
