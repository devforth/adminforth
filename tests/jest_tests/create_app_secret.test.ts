import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createAppDir = path.resolve(currentDir, '../../adminforth/commands/createApp');

// utils.js imports the CLI entry (cli.js), whose top-level command switch runs on import and
// whose import graph runs dotenv.config({ path: '.env' }) against the cwd; import it with no argv
// command, a muted console and an empty cwd so nothing dispatches, prints or leaks into process.env
const { writeTemplateFiles } = await (async () => {
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

const options = {
  appName: 'secret-demo',
  dbUrl: 'sqlite://.db.sqlite',
  dbUrlProd: 'sqlite:///code/db/.db.sqlite',
  prismaDbUrl: null,
  prismaDbUrlProd: null,
  provider: 'sqlite',
  nodeMajor: 22,
  sqliteFile: '.db.sqlite',
};

const HEX_64 = /^ADMINFORTH_SECRET=([0-9a-f]{64})$/m;
// the scaffolder asks the npm registry for the current version range (with an offline fallback)
const SCAFFOLD_TIMEOUT_MS = 30_000;
const tmpDirs: string[] = [];

async function scaffold(): Promise<string> {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'af-create-app-'));
  tmpDirs.push(cwd);
  await writeTemplateFiles(createAppDir, cwd, false, false, options);
  return cwd;
}

function secretOf(env: string): string {
  const match = env.match(HEX_64);
  if (!match) {
    throw new Error(`no 64-hex ADMINFORTH_SECRET in:\n${env}`);
  }
  return match[1];
}

let app: string;
let savedUmask: number;
// normalise CRLF so a Windows checkout with autocrlf does not break the line-anchored assertions
const read = async (file: string) => (await fs.readFile(path.join(app, file), 'utf-8')).replace(/\r\n/g, '\n');

beforeAll(async () => {
  // a permissive umask makes the owner-only assertion below meaningful on any host
  savedUmask = process.umask(0o022);
  app = await scaffold();
}, SCAFFOLD_TIMEOUT_MS);

afterAll(async () => {
  process.umask(savedUmask);
  await Promise.all(tmpDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('create-app scaffolds ADMINFORTH_SECRET', () => {
  it('writes a random 32-byte hex secret into .env', async () => {
    expect(secretOf(await read('.env'))).toHaveLength(64);
  });

  it('keeps .env out of git and out of the Docker build context', async () => {
    expect((await read('.gitignore')).split('\n')).toContain('.env');
    expect((await read('.dockerignore')).split('\n')).toContain('.env');
  });

  it('makes .env readable by its owner only', async () => {
    if (process.platform === 'win32') {
      return;
    }
    const modeOf = async (file: string) => ((await fs.stat(path.join(app, file))).mode & 0o777).toString(8);

    expect(await modeOf('.env')).toBe('600');
    // the tightened mode is specific to the secret file, not applied to every generated file
    expect(await modeOf('.env.example')).toBe('644');
  });

  it('tightens a pre-existing world-readable .env to owner-only', async () => {
    if (process.platform === 'win32') {
      return;
    }
    // writeFile's mode is ignored when the file already exists; the explicit chmod must still apply
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'af-create-app-'));
    tmpDirs.push(cwd);
    await fs.writeFile(path.join(cwd, '.env'), 'ADMINFORTH_SECRET=stale\n', { mode: 0o644 });

    await writeTemplateFiles(createAppDir, cwd, false, false, options);

    expect(((await fs.stat(path.join(cwd, '.env'))).mode & 0o777).toString(8)).toBe('600');
  }, SCAFFOLD_TIMEOUT_MS);

  it('generates a different secret for every scaffolded app', async () => {
    const other = await scaffold();

    expect(secretOf(await read('.env'))).not.toEqual(secretOf(await fs.readFile(path.join(other, '.env'), 'utf-8')));
  }, SCAFFOLD_TIMEOUT_MS);

  it('keeps the secret out of the committed .env.local', async () => {
    expect(await read('.env.local')).not.toContain('ADMINFORTH_SECRET');
  });

  it('ships a committed .env.example so a cloning teammate knows what to create', async () => {
    const example = await read('.env.example');

    expect(example).toMatch(/^ADMINFORTH_SECRET=$/m);
    expect(example).toContain('openssl rand -hex 32');
  });

  it('tells a cloning teammate how to create their own secret before the first start', async () => {
    const readme = await read('README.md');

    // owner-only file, and never truncating an .env that already exists
    expect(readme).toContain('[ -f .env ] || (umask 077; echo "ADMINFORTH_SECRET=$(openssl rand -hex 32)" > .env)');
  });

  it('does not hardcode the secret into the README deployment command', async () => {
    const readme = await read('README.md');

    expect(readme).not.toContain('ADMINFORTH_SECRET=123');
    expect(readme).toContain('-e ADMINFORTH_SECRET="$ADMINFORTH_SECRET"');
    // the export line must be valid shell when pasted as-is (no <placeholder> redirection)
    expect(readme).toContain('export ADMINFORTH_SECRET="$(openssl rand -hex 32)"');
  });
});
