import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import request from 'supertest';

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(currentDir, '../application');
const sqliteDbPath = path.join(applicationDir, '.db.sqlite');

const testEnv = {
  ...process.env,
  ADMINFORTH_SECRET: process.env.ADMINFORTH_SECRET ?? '123',
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  SQLITE_URL: process.env.SQLITE_URL ?? `sqlite://${sqliteDbPath}`,
  SQLITE_FILE_URL: process.env.SQLITE_FILE_URL ?? `file:${sqliteDbPath}`,
};

process.env.ADMINFORTH_SECRET = testEnv.ADMINFORTH_SECRET;
process.env.NODE_ENV = testEnv.NODE_ENV;
process.env.SQLITE_URL = testEnv.SQLITE_URL;
process.env.SQLITE_FILE_URL = testEnv.SQLITE_FILE_URL;

await fs.rm(sqliteDbPath, { force: true });
await execFileAsync('pnpm', ['migrate:local'], {
  cwd: applicationDir,
  env: testEnv,
});

const { app, appReady, closeApplication } = await import('../application/index');
await appReady;

const agent = request.agent(app);

export { agent, app, closeApplication };