import arg from 'arg';
import chalk from 'chalk';
import fs from 'fs';
import fse from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import os from 'os';
import { Listr } from 'listr2'
import { fileURLToPath, pathToFileURL } from 'url';
import {ConnectionString} from 'connection-string';
import { exec } from 'child_process';

import Handlebars from 'handlebars';
import { promisify } from 'util';
import { resolveAdminforthVersionRange } from '../cli.js';

import { URL } from 'url'
import net from 'net'

const execAsync = promisify(exec);

const SUPPORTED_DB_URL_SCHEMES =['sqlite://', 'postgresql://', 'mongodb://', 'mysql://', 'clickhouse://'];
const PRISMA_MIGRATION_DB_PROTOCOLS = ['sqlite', 'postgres', 'postgresql', 'mysql'];
const DEFAULT_DB_URL = 'sqlite://.db.sqlite';
const ADMINUSER_TABLE_EXAMPLE_NOTE = 'This is only an example schema. We recommend using your favorite migration tool to create and evolve this table, and adding database indexes or constraints only when they match your project requirements.';


export function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--app-name': String,
      '--db': String,
      '--use-npm': Boolean,
      // you can add more flags here if needed
    },
    {
      argv: rawArgs.slice(1),  // skip "create-app"
    }
  );

  return {
    appName: args['--app-name'],
    db: args['--db'],
    useNpm: args['--use-npm'],
  };
}

function generateAdminUserTableInstructions(provider) {
  if (provider === 'postgresql') {
    return `\`\`\`sql
CREATE TABLE adminuser (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
\`\`\`

${ADMINUSER_TABLE_EXAMPLE_NOTE}`;
  }

  if (provider === 'mysql') {
    return `\`\`\`sql
CREATE TABLE adminuser (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL
);
\`\`\`

${ADMINUSER_TABLE_EXAMPLE_NOTE}`;
  }

  if (provider === 'sqlite') {
    return `\`\`\`sql
CREATE TABLE adminuser (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME NOT NULL
);
\`\`\`

${ADMINUSER_TABLE_EXAMPLE_NOTE}`;
  }

  if (provider === 'clickhouse') {
    return `\`\`\`sql
CREATE TABLE adminuser (
  id String,
  email String,
  password_hash String,
  role String,
  created_at DateTime
)
ENGINE = MergeTree()
ORDER BY id;
\`\`\`

${ADMINUSER_TABLE_EXAMPLE_NOTE}`;
  }

  return null;
}

// Maps an AdminForth db provider to the matching `@adminforth/connector-*` package suffix.
function providerToConnectorName(provider) {
  if (provider === 'postgresql') return 'postgres';
  if (provider === 'mongodb') return 'mongo';
  return provider;
}

// Returns the default-exported connector class for the given connector name.
// Connectors are optional peer dependencies, so they are not present during a
// fresh `npx adminforth create-app`. We first try to import an already-installed
// one (local development / monorepo), then fall back to installing it on demand.
async function loadConnectorClass(connectorName) {
  const pkg = `@adminforth/connector-${connectorName}`;

  try {
    return (await import(pkg)).default;
  } catch {
    // Not installed in this context — install it on demand below.
  }

  console.log(chalk.dim(`\nInstalling ${pkg} to inspect the target database...`));
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'adminforth-connector-'));
  await fs.promises.writeFile(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'adminforth-connector-probe', version: '0.0.0', private: true, type: 'module' }),
  );
  // npm (>=7) installs the connector's `adminforth` peer dependency automatically,
  // which is enough to import and run the connector for the emptiness probe.
  await execAsync(`npm install ${pkg} --no-audit --no-fund --loglevel=error`, {
    cwd: tmpDir,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  const entry = path.join(tmpDir, 'node_modules', '@adminforth', `connector-${connectorName}`, 'dist', 'index.js');
  return (await import(pathToFileURL(entry).href)).default;
}

// Decides whether the target database already contains user data and records the
// result on `options.existingDb`. When it does, AdminForth treats the database as
// "owned" by the user and skips Prisma scaffolding.
async function inspectDatabaseCleanState(options) {
  const connectionString = parseConnectionString(options.db);
  const provider = detectDbProvider(connectionString.protocol);
  const dbConnString = connectionString.toString();

  // Fast path for SQLite: a missing file is by definition a brand new database.
  // Avoid connecting (which would otherwise create the file) and avoid pulling the
  // connector for the common new-project case.
  if (provider === 'sqlite') {
    const sqliteFile = dbConnString.replace('sqlite://', '');
    if (!sqliteFile || !fs.existsSync(sqliteFile)) {
      options.existingDb = false;
      return;
    }
  }

  let Connector;
  try {
    Connector = await loadConnectorClass(providerToConnectorName(provider));
  } catch (error) {
    // Could not obtain the connector (e.g. offline). Treat the database as new so
    // the normal Prisma flow stays available instead of failing create-app.
    console.log(chalk.yellow(`\n⚠️  Could not load the database connector to inspect the database (${error.message}). Continuing as a new database.`));
    options.existingDb = false;
    return;
  }

  const connector = new Connector();

  if (typeof connector.isDatabaseEmpty !== 'function') {
    // Connector predates the isDatabaseEmpty() probe (version skew); cannot
    // determine emptiness, so assume a new database and keep the Prisma flow.
    options.existingDb = false;
    return;
  }

  try {
    await connector.setupClient(dbConnString);
  } catch (error) {
    if (provider === 'sqlite' && error.message?.includes('directory does not exist')) {
      options.existingDb = false;
      return;
    }
    throw error;
  }

  try {
    options.existingDb = !(await connector.isDatabaseEmpty());
  } finally {
    if (typeof connector.close === 'function') {
      await connector.close();
    }
  }
}

export async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.appName) {
      questions.push({
      type: 'input',
      name: 'appName',
      message: 'Please specify the name of the app >',
      default: 'adminforth-app',
      });
  };

  if (!options.db) {
      questions.push({
      type: 'input',
      name: 'db',
      message: 'Please specify the database URL to use >',
      default: DEFAULT_DB_URL,
      });
  };

  if (!options.useNpm) {
    questions.push({
      type: 'select',
      name: 'useNpm',
      message: 'Select your package manager >',
      choices: [
        { name: 'pnpm', value: false },
        { name: 'npm', value: true },
      ],
      default: false,
    });
  }

  const answers = await inquirer.prompt(questions);
  const resolvedOptions = {
      ...options,
      appName: options.appName || answers.appName,
      db: options.db || answers.db,
      useNpm: options.useNpm || answers.useNpm,
  };
  resolvedOptions.existingDb = false;

  await inspectDatabaseCleanState(resolvedOptions);

  if (
    resolvedOptions.includePrismaMigrations === undefined &&
    isPrismaMigrationDbUrl(resolvedOptions.db) &&
    !resolvedOptions.existingDb
  ) {
    const prismaAnswer = await inquirer.prompt([{
      type: 'select',
      name: 'includePrismaMigrations',
      message: 'Include Prisma migrations? >',
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
      default: true,
    }]);
    resolvedOptions.includePrismaMigrations = prismaAnswer.includePrismaMigrations;
  } else {
    resolvedOptions.includePrismaMigrations = Boolean(resolvedOptions.includePrismaMigrations) && !resolvedOptions.existingDb;
  }

  return resolvedOptions;
}

function checkNodeVersion(minRequiredVersion = 20) {
  const current = process.versions.node.split('.');
  const major = parseInt(current[0], 10);

  if (isNaN(major) || major < minRequiredVersion) {
    throw new Error(
      `Node.js v${minRequiredVersion}+ is required. You have ${process.versions.node}. ` +
      `Please upgrade Node.js. We recommend using nvm for managing multiple Node.js versions.`
    );
  }
}

function parseConnectionString(dbUrl) {
  return new ConnectionString(dbUrl);
}

function isPrismaMigrationDbUrl(dbUrl) {
  try {
    const connectionString = parseConnectionString(dbUrl);
    return PRISMA_MIGRATION_DB_PROTOCOLS.includes(connectionString.protocol);
  } catch {
    return false;
  }
}

function detectDbProvider(protocol) {
  if (protocol.startsWith('sqlite')) {
    return 'sqlite';
  } else if (protocol.startsWith('postgres')) {
    return 'postgresql';
  } else if (protocol.startsWith('mongodb')) {
    return 'mongodb';
  } else if (protocol.startsWith('mysql')) {
    return 'mysql';
  } else if (protocol.startsWith('clickhouse')) {
    return 'clickhouse';
  }

  const message = `Unknown database provider for ${protocol}. Supported database URL schemes: ${SUPPORTED_DB_URL_SCHEMES.join(', ')}.`;
  throw new Error(message);
}

function generateDbUrlForPrisma(connectionString) {
  if (!PRISMA_MIGRATION_DB_PROTOCOLS.includes(connectionString.protocol))
    return null;
  if (connectionString.protocol.startsWith('sqlite'))
    return `file:${connectionString.host}`;
  return connectionString.toString();
}

function generateDbUrlForPrismaProd(connectionString) {
  if (!PRISMA_MIGRATION_DB_PROTOCOLS.includes(connectionString.protocol))
    return null;
  if (connectionString.protocol.startsWith('sqlite'))
    return `file:/code/db/${connectionString.host}`;
  return connectionString.toString();
}

function generateDbUrlForAfProd(connectionString) {
  if (connectionString.protocol.startsWith('sqlite'))
    return `sqlite:////code/db/${connectionString.host}`;
  return connectionString.toString();
}

function initialChecks(options) {
  return [
    {
      title: '👀 Checking Node.js version...',
      task: () => checkNodeVersion(20)
    },
    {
      title: '👀 Validating current working directory...',
      task: () => checkForExistingPackageJson(options)
    }
  ]
}

function checkForExistingPackageJson(options) {
  const projectDir = path.join(process.cwd(), options.appName);
  if (fs.existsSync(projectDir)) {
    throw new Error(
      `Directory "${options.appName}" already exists.\n` +
      `Please remove it or use a different name.`
    );
  }
}

function checkIfDatabaseLocal(urlString) {
  if (urlString.startsWith('sqlite')) {
    return true;
  }
  try {
    const url = new URL(urlString)

    const host = url.hostname

    if (!host) return false

    // localhost
    if (host === 'localhost') return true

    // loopback ipv4
    if (host === '127.0.0.1') return true

    // loopback ipv6
    if (host === '::1') return true

    // private IP ranges
    if (net.isIP(host)) {
      if (
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.match(/^172\.(1[6-9]|2\d|3[0-1])\./)
      ) {
        return true
      }
    }


    return false
  } catch {
    return false
  }
}

async function scaffoldProject(ctx, options, cwd) {
  const projectDir = path.join(cwd, options.appName);
  await fse.ensureDir(projectDir);

  const connectionString = parseConnectionString(options.db);
  const connectionStringProd = generateDbUrlForAfProd(connectionString);

  const provider = detectDbProvider(connectionString.protocol);
  const prismaDbUrl = generateDbUrlForPrisma(connectionString);
  const prismaDbUrlProd = generateDbUrlForPrismaProd(connectionString);


  ctx.skipPrismaSetup = !options.includePrismaMigrations || !prismaDbUrl;
  const appName = options.appName;

  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  // Prepare directories
  ctx.customDir = path.join(projectDir, 'custom');
  await fse.ensureDir(ctx.customDir);
  await fse.ensureDir(path.join(projectDir, 'resources'));

  // Copy static assets to `custom/assets`
  const sourceAssetsDir = path.join(dirname, 'assets');
  const targetAssetsDir = path.join(ctx.customDir, 'assets');
  await fse.ensureDir(targetAssetsDir);
  await fse.copy(sourceAssetsDir, targetAssetsDir);

  // Write templated files
  await writeTemplateFiles(dirname, projectDir, options.useNpm, options.includePrismaMigrations, {
    dbUrl: connectionString.toString(),
    dbUrlProd: connectionStringProd,
    prismaDbUrl,
    prismaDbUrlProd,
    appName,
    provider,
    existingDb: options.existingDb,
    nodeMajor: parseInt(process.versions.node.split('.')[0], 10),
    sqliteFile: connectionString.protocol.startsWith('sqlite') ? connectionString.host : null,
  });

  return projectDir;  // Return the new directory path
}

function getPackageManagerTemplateData(useNpm, nodeMajor) {
  return {
    packageManager: useNpm ? 'npm' : 'pnpm',
    packageManagerRun: useNpm ? 'npm run' : 'pnpm',
    packageManagerScriptArgSeparator: useNpm ? ' -- ' : ' ',
    packageManagerExec: useNpm ? 'npx' : 'pnpm exec',
    packageManagerEnvDev: useNpm ? 'npm run _env:dev --' : 'pnpm _env:dev',
    packageManagerEnvProd: useNpm ? 'npm run _env:prod --' : 'pnpm _env:prod',
    dockerBaseImage: useNpm ? `node:${nodeMajor}-slim` : 'devforth/node20-pnpm:latest',
    dockerAdditionalManifestFiles: useNpm ? 'package-lock.json' : 'pnpm-lock.yaml pnpm-workspace.yaml',
    dockerPackageInstallSubcommand: useNpm ? 'ci' : 'i',
  };
}

async function writeTemplateFiles(dirname, cwd, useNpm, includePrismaMigrations, options) {
  const {
    dbUrl, prismaDbUrl, appName, provider, existingDb, nodeMajor,
    dbUrlProd, prismaDbUrlProd, sqliteFile
   } = options;
  const packageManagerTemplateData = getPackageManagerTemplateData(useNpm, nodeMajor);
  const adminforthVersion = await resolveAdminforthVersionRange();
  const resolvedPrismaDbUrl = includePrismaMigrations ? prismaDbUrl : null;
  const resolvedPrismaDbUrlProd = includePrismaMigrations ? prismaDbUrlProd : null;
  const connectorProvider = providerToConnectorName(provider);

  // Build a list of files to generate
  const templateTasks = [
    {
      src: 'tsconfig.json.hbs',
      dest: 'tsconfig.json',
      data: {},
    },
    {
      src: 'index.ts.hbs',
      dest: 'index.ts',
      data: { appName },
    },
    {
      src: 'api.ts.hbs',
      dest: 'api.ts',
      data: {},
    },
    {
      src: '.gitignore.hbs',
      dest: '.gitignore',
      data: {},
    },
    {
      src: '.env.local.hbs',
      dest: '.env.local',
      data: { dbUrl: checkIfDatabaseLocal(dbUrl) ? dbUrl : null, prismaDbUrl: resolvedPrismaDbUrl },
    },
    {
      src: '.env.prod.hbs',
      dest: '.env.prod',
      data: { prismaDbUrlProd: resolvedPrismaDbUrlProd, dbUrlProd },
    },
    {
      src: 'readme.md.hbs',
      dest: 'README.md',
      data: {
        dbUrl,
        prismaDbUrl: resolvedPrismaDbUrl,
        appName,
        sqliteFile,
        existingDb,
        adminUserTableInstructions: existingDb ? generateAdminUserTableInstructions(provider) : null,
      },
    },
    {
      src: 'AGENTS.md.hbs',
      dest: 'AGENTS.md',
      data: { prismaDbUrl: resolvedPrismaDbUrl },
    },
    {
      src: 'CLAUDE.md.hbs',
      dest: 'CLAUDE.md',
      data: {},
    },
    {
      src: '.agents/skills/adminforth/SKILL.md.hbs',
      dest: '.agents/skills/adminforth/SKILL.md',
      data: { prismaDbUrl: resolvedPrismaDbUrl },
    },
    {
      src: '.agents/skills/adminforth-permissions/SKILL.md.hbs',
      dest: '.agents/skills/adminforth-permissions/SKILL.md',
      data: {},
    },
    {
      src: '.agents/skills/adminforth-hooks/SKILL.md.hbs',
      dest: '.agents/skills/adminforth-hooks/SKILL.md',
      data: {},
    },
    {
      src: '.agents/skills/adminforth-custom-vue/SKILL.md.hbs',
      dest: '.agents/skills/adminforth-custom-vue/SKILL.md',
      data: {},
    },
    {
      // We'll write .env using the same content as .env.sample
      src: '.env.hbs',
      dest: '.env',
      data: { dbUrl, prismaDbUrl: resolvedPrismaDbUrl },
    },
    {
      src: 'adminuser.ts.hbs',
      dest: 'resources/adminuser.ts',
      data: {},
    },
    {
      src: 'custom/tsconfig.json.hbs',
      dest: 'custom/tsconfig.json',
      data: {},
    },
    {
      src: '.dockerignore.hbs',
      dest: '.dockerignore',
      data: {
        sqliteFile,
      },
    },
    {
      src: 'Dockerfile.hbs',
      dest: 'Dockerfile',
      data: {},
    },
    {
      src: 'package.json.hbs',
      dest: 'package.json',
      data: { 
        appName,
        adminforthVersion: adminforthVersion,
        includePrismaMigrations: Boolean(resolvedPrismaDbUrl),
        connectorProvider: connectorProvider,
      },
    },
    {
      src: 'custom/package.json.hbs',
      dest: 'custom/package.json',
      data: {}
    },
    {
      src: 'globalPlugins.ts.hbs',
      dest: 'globalPlugins.ts',
      data: {},
    }
  ];

  if (!useNpm) {
    templateTasks.push(
      {
        src: 'pnpm_templates/pnpm-workspace.yaml.hbs',
        dest: 'pnpm-workspace.yaml',
        data: {},
      },
      {
        src: 'pnpm_templates/pnpm-lock.yaml.hbs',
        dest: 'custom/pnpm-lock.yaml',
        data: {},
      }
    )
  }

  if (resolvedPrismaDbUrl) {
    templateTasks.push(
      {
        src: 'schema.prisma.hbs',
        dest: 'schema.prisma',
        data: { provider },
        condition: Boolean(prismaDbUrl), // only create if prismaDbUrl is truthy
      },
      {
        src:  'prisma.config.ts.hbs',
        dest: 'prisma.config.ts',
        data: {},
      },
    )
  }

  for (const task of templateTasks) {
    // If a condition is specified and false, skip this file
    if (task.condition === false) continue;

    const destPath = path.join(cwd, task.dest);
    await fse.ensureDir(path.dirname(destPath));

    if (task.empty) {
      await fs.promises.writeFile(destPath, '');
    } else {
      const templatePath = path.join(dirname, 'templates', task.src);
      const compiled = renderHBSTemplate(templatePath, {
        ...packageManagerTemplateData,
        ...task.data,
      });
      await fs.promises.writeFile(destPath, compiled);
    }
  }
}

async function installDependenciesPnpm(ctx, cwd) {
  const isWindows = process.platform === 'win32';

  const nodeBinary = process.execPath; 
  const pnpmPath = path.join(path.dirname(nodeBinary), isWindows ? 'pnpm.cmd' : 'pnpm');
  const customDir = ctx.customDir;
  if (isWindows) {
    const res = await Promise.all([
      execAsync(`pnpm install`, { cwd, env: { PATH: process.env.PATH } }),
      execAsync(`pnpm install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  } else {
    const res = await Promise.all([
      execAsync(`${nodeBinary} ${pnpmPath} install`, { cwd, env: { PATH: process.env.PATH } }),
      execAsync(`${nodeBinary} ${pnpmPath} install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  }
}

async function installDependenciesNpm(ctx, cwd) {
  const isWindows = process.platform === 'win32';

  const nodeBinary = process.execPath; 
  const npmPath = path.join(path.dirname(nodeBinary), isWindows ? 'npm.cmd' : 'npm');
  const customDir = ctx.customDir;
  if (isWindows) {
    const res = await Promise.all([
      execAsync(`npm install`, { cwd, env: { PATH: process.env.PATH } }),
      execAsync(`npm install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  } else {
    const res = await Promise.all([
      execAsync(`${nodeBinary} ${npmPath} install`, { cwd, env: { PATH: process.env.PATH } }),
      execAsync(`${nodeBinary} ${npmPath} install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  }
}

function generateFinalInstructionsPnpm(skipPrismaSetup, options) {
  let instruction = '⏭️  Run the following commands to get started:\n';
  const provider = detectDbProvider(parseConnectionString(options.db).protocol);
  const adminUserTableInstructions = options.existingDb ? generateAdminUserTableInstructions(provider) : null;
  instruction += `
  ${chalk.dim('// Go to the project directory')}
  ${chalk.dim('$')}${chalk.cyan(` cd ${options.appName}`)}\n`;

  if (!skipPrismaSetup)
    instruction += `
  ${chalk.dim('// Generate and apply initial migration')}
  ${chalk.dim('$')}${chalk.cyan(' pnpm makemigration --name init && pnpm migrate:local')}\n`;

  if (adminUserTableInstructions)
    instruction += `
  ${chalk.dim('// Create the adminuser table in your database before starting the app')}
  ${adminUserTableInstructions}\n`;

  instruction += `
  ${chalk.dim('// Start dev server with tsx watch for hot-reloading')}
  ${chalk.dim('$')}${chalk.cyan(' pnpm dev')}\n
`;

  instruction += '😉 Happy coding!';

  return instruction;
}

function generateFinalInstructionsNpm(skipPrismaSetup, options) {
  let instruction = '⏭️  Run the following commands to get started:\n';
  const provider = detectDbProvider(parseConnectionString(options.db).protocol);
  const adminUserTableInstructions = options.existingDb ? generateAdminUserTableInstructions(provider) : null;
  instruction += `
  ${chalk.dim('// Go to the project directory')}
  ${chalk.dim('$')}${chalk.cyan(` cd ${options.appName}`)}\n`;

  if (!skipPrismaSetup)
    instruction += `
  ${chalk.dim('// Generate and apply initial migration')}
  ${chalk.dim('$')}${chalk.cyan(' npm run makemigration -- --name init && npm run migrate:local')}\n`;

  if (adminUserTableInstructions)
    instruction += `
  ${chalk.dim('// Create the adminuser table in your database before starting the app')}
  ${adminUserTableInstructions}\n`;

  instruction += `
  ${chalk.dim('// Start dev server with tsx watch for hot-reloading')}
  ${chalk.dim('$')}${chalk.cyan(' npm run dev')}\n
`;

  instruction += '😉 Happy coding!';

  return instruction;
}

function renderHBSTemplate(templatePath, data) {
  // Example: renderHBRTemplate('path/to/template.hbs', {name: 'John Doe'})
  const template = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(template);
  return compiled(data);
}

export function prepareWorkflow(options) {
  const cwd = process.cwd();
  const tasks = new Listr([
    {
      title: '🔍 Initial checks...',
      task: (_, task) =>
        task.newListr(
          initialChecks(options),
          { concurrent: true },
        )
    },
    {
      title: '🚀 Scaffolding your project...',
      task: async (ctx) => {
        ctx.projectDir = await scaffoldProject(ctx, options, cwd);
      }
    },
    {
      title: '📦 Installing dependencies...',
      task: async (ctx) => {
        if (options.useNpm) {
          await installDependenciesNpm(ctx, ctx.projectDir);
        } else {
          await installDependenciesPnpm(ctx, ctx.projectDir);
        }
      }
    },
    {
      title: '📝 Preparing final instructions...',
      task: (ctx) => {
        console.log(chalk.green(`✅ Successfully created your new Adminforth project in ${ctx.projectDir}!\n`));
        if (options.useNpm) {
          console.log(generateFinalInstructionsNpm(ctx.skipPrismaSetup, options));
        } else {
          console.log(generateFinalInstructionsPnpm(ctx.skipPrismaSetup, options));
        }
        console.log('\n\n');
      }
    }
  ],
  {
    rendererOptions: {collapseSubtasks: false},
    concurrent: false,
    exitOnError: true,
    collectErrors: true,
  });

  return tasks;
}
