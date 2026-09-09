import { jest } from '@jest/globals';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createAppDir = path.resolve(currentDir, '../../adminforth/commands/createApp');
// mock by absolute path: neither package resolves from this directory, both resolve from utils.js
const cliRequire = createRequire(path.join(createAppDir, 'utils.js'));

// the path `import` reaches, which is not the one require.resolve reports for a dual package
function esmEntry(pkg: string) {
  const manifest = cliRequire.resolve(`${pkg}/package.json`);
  const json = JSON.parse(readFileSync(manifest, 'utf8'));
  const root = json.exports?.['.'];
  return path.join(path.dirname(manifest), root?.import?.default ?? root?.import ?? root?.default ?? json.main);
}

// answer every question with its own default, which is what pressing Enter does
const prompt = jest.fn(async (questions: any[]) =>
  Object.fromEntries(questions.map((question) => [question.name, question.default])));
jest.unstable_mockModule(esmEntry('inquirer'), () => ({ default: { prompt } }));

// a connector with no isDatabaseEmpty() is how version skew looks: the CLI cannot tell whether
// the database already has tables
jest.unstable_mockModule(esmEntry('@adminforth/connector-sqlite'), () => ({
  default: class { async setupClient() {} async close() {} },
}));

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
const { promptForMissingOptions } = utils as any;

const tmpDirs: string[] = [];
async function tmpDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'af-prisma-default-'));
  tmpDirs.push(dir);
  return dir;
}

let logSpy: any;
beforeEach(() => {
  prompt.mockClear();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await Promise.all(tmpDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function prismaQuestion() {
  const call = prompt.mock.calls.find(([questions]: any) => questions[0]?.name === 'includePrismaMigrations');
  return call?.[0][0];
}

describe('create-app Prisma migrations default', () => {
  it('offers Prisma by default when the database was inspected and is empty', async () => {
    const db = `sqlite://${path.join(await tmpDir(), 'missing.db')}`;

    const resolved = await promptForMissingOptions({ appName: 'x', db, useNpm: true });

    expect(resolved.dbInspected).toBe(true);
    expect(resolved.existingDb).toBe(false);
    expect(prismaQuestion()?.default).toBe(true);
    expect(resolved.includePrismaMigrations).toBe(true);
  });

  it('does not offer Prisma by default when the database could not be inspected', async () => {
    const file = path.join(await tmpDir(), 'unknown.db');
    await fs.writeFile(file, '');

    const resolved = await promptForMissingOptions({ appName: 'x', db: `sqlite://${file}`, useNpm: true });

    expect(resolved.dbInspected).toBe(false);
    expect(prismaQuestion()?.default).toBe(false);
    // pressing Enter must not scaffold migrations for a database that may already hold data
    expect(resolved.includePrismaMigrations).toBe(false);
    const printed = logSpy.mock.calls.flat().join('\n');
    expect(printed).toMatch(/could not be inspected/i);
    // the notice must not tell the user to pick what is already the default
    expect(printed).not.toMatch(/answer no/i);
  });
});
