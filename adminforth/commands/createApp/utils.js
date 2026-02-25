import arg from 'arg';
import chalk from 'chalk';
import fs from 'fs';
import fse from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { Listr } from 'listr2'
import { fileURLToPath } from 'url';
import {ConnectionString} from 'connection-string';
import { exec } from 'child_process';

import Handlebars from 'handlebars';
import { promisify } from 'util';
import { getVersion } from '../cli.js';

import { URL } from 'url'
import net from 'net'

const execAsync = promisify(exec);

function detectAdminforthVersion() {
  try {
    const version =  getVersion();

    if (typeof version !== 'string') {
      throw new Error('Invalid version format');
    }

    if (version.includes('next')) {
      return 'next';
    }
    return 'latest';
  } catch (err) {
    console.warn('⚠️ Could not detect AdminForth version, defaulting to "latest".');
    return 'latest';
  }
}

const adminforthVersion = detectAdminforthVersion();


export function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--app-name': String,
      '--db': String,
      // you can add more flags here if needed
    },
    {
      argv: rawArgs.slice(1),  // skip "create-app"
    }
  );

  return {
    appName: args['--app-name'],
    db: args['--db'],
  };
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
      default: 'sqlite://.db.sqlite',
      });
  };

  const answers = await inquirer.prompt(questions);
  return {
      ...options,
      appName: options.appName || answers.appName,
      db: options.db || answers.db,
  };
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

function detectDbProvider(protocol) {
  if (protocol.startsWith('sqlite')) {
    return 'sqlite';
  } else if (protocol.startsWith('postgres')) {
    return 'postgresql';
  } else if (protocol.startsWith('mongodb')) {
    return 'mongodb';
  } else if (protocol.startsWith('mysql')) {
    return 'mysql';
  }

  const message = `Unknown database provider for ${protocol}. Only SQLite, PostgreSQL, and MongoDB are supported now.`;
  throw new Error(message);
}

function generateDbUrlForPrisma(connectionString) {
  if (connectionString.protocol.startsWith('sqlite'))
    return `file:${connectionString.host}`;
  if (connectionString.protocol.startsWith('mongodb'))
    return null;
  return connectionString.toString();
}

function generateDbUrlForPrismaProd(connectionString) {
  if (connectionString.protocol.startsWith('sqlite'))
    return `file:/code/db/${connectionString.host}`;
  if (connectionString.protocol.startsWith('mongodb'))
    return null;
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


  ctx.skipPrismaSetup = !prismaDbUrl;
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
  await writeTemplateFiles(dirname, projectDir, {
    dbUrl: connectionString.toString(),
    dbUrlProd: connectionStringProd,
    prismaDbUrl,
    prismaDbUrlProd,
    appName,
    provider,
    nodeMajor: parseInt(process.versions.node.split('.')[0], 10),
    sqliteFile: connectionString.protocol.startsWith('sqlite') ? connectionString.host : null,
  });

  return projectDir;  // Return the new directory path
}

async function writeTemplateFiles(dirname, cwd, options) {
  const { 
    dbUrl, prismaDbUrl, appName, provider, nodeMajor,
    dbUrlProd, prismaDbUrlProd, sqliteFile
   } = options;

  // Build a list of files to generate
  const templateTasks = [
    {
      src: 'tsconfig.json.hbs',
      dest: 'tsconfig.json',
      data: {},
    },
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
    {
      src: 'package.json.hbs',
      dest: 'package.json',
      data: { 
        appName,
        adminforthVersion: adminforthVersion,
       },
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
      data: { dbUrl: checkIfDatabaseLocal(dbUrl) ? dbUrl : null, prismaDbUrl },
    },
    {
      src: '.env.prod.hbs',
      dest: '.env.prod',
      data: { prismaDbUrlProd, dbUrlProd },
    },
    {
      src: 'readme.md.hbs',
      dest: 'README.md',
      data: { dbUrl, prismaDbUrl, appName, sqliteFile },
    },
    {
      // We'll write .env using the same content as .env.sample
      src: '.env.local.hbs',
      dest: '.env',
      data: {dbUrl, prismaDbUrl},
    },
    {
      src: 'adminuser.ts.hbs',
      dest: 'resources/adminuser.ts',
      data: {},
    },
    {
      src: 'custom/package.json.hbs',
      dest: 'custom/package.json',
      data: {},
    },
    {
      src: 'custom/tsconfig.json.hbs',
      dest: 'custom/tsconfig.json',
      data: {},
    },
    {
      src: 'Dockerfile.hbs',
      dest: 'Dockerfile',
      data: { nodeMajor },
    },
    {
      src: '.dockerignore.hbs',
      dest: '.dockerignore',
      data: {
        sqliteFile,
      },
    }
  ];

  for (const task of templateTasks) {
    // If a condition is specified and false, skip this file
    if (task.condition === false) continue;

    const destPath = path.join(cwd, task.dest);
    // fse.ensureDirSync(path.dirname(destPath));

    if (task.empty) {
      await fs.promises.writeFile(destPath, '');
    } else {
      const templatePath = path.join(dirname, 'templates', task.src);
      const compiled = renderHBSTemplate(templatePath, task.data);
      await fs.promises.writeFile(destPath, compiled);
    }
  }
}

async function installDependencies(ctx, cwd) {
  const isWindows = process.platform === 'win32';

  const nodeBinary = process.execPath; 
  const npmPath = path.join(path.dirname(nodeBinary), isWindows ? 'npm.cmd' : 'npm');
  const customDir = ctx.customDir;
  if (isWindows) {
    const res = await Promise.all([
      await execAsync(`npm install`, { cwd, env: { PATH: process.env.PATH } }),
      await execAsync(`npm install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  } else {
    const res = await Promise.all([
      await execAsync(`${nodeBinary} ${npmPath} install`, { cwd, env: { PATH: process.env.PATH } }),
      await execAsync(`${nodeBinary} ${npmPath} install`, { cwd: customDir, env: { PATH: process.env.PATH } }),
    ]);
  }
  // console.log(chalk.dim(`Dependencies installed in ${cwd} and ${customDir}: \n${res[0].stdout}${res[1].stdout}`));
}

function generateFinalInstructions(skipPrismaSetup, options) {
  let instruction = '⏭️  Run the following commands to get started:\n';
  if (!skipPrismaSetup)
    instruction += `
  ${chalk.dim('// Go to the project directory')}
  ${chalk.dim('$')}${chalk.cyan(` cd ${options.appName}`)}\n`;

    instruction += `
  ${chalk.dim('// Generate and apply initial migration')}
  ${chalk.dim('$')}${chalk.cyan(' npm run makemigration -- --name init && npm run migrate:local')}\n`;

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
      task: async (ctx) => installDependencies(ctx, ctx.projectDir)
    },
    {
      title: '📝 Preparing final instructions...',
      task: (ctx) => {
        console.log(chalk.green(`✅ Successfully created your new Adminforth project in ${ctx.projectDir}!\n`));
        console.log(generateFinalInstructions(ctx.skipPrismaSetup, options));
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
