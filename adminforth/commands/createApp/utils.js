import arg from 'arg';
import chalk from 'chalk';
import fs from 'fs';
import fse from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { Listr } from 'listr2'
import { fileURLToPath } from 'url';
import {ConnectionString} from 'connection-string';
import {execa} from 'execa';
import Handlebars from 'handlebars';

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
      `Please upgrade Node.js.`
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

function initialChecks() {
  return [
    {
      title: '👀 Checking Node.js version...',
      task: () => checkNodeVersion(20)
    },
    {
      title: '👀 Validating current working directory...',
      task: () => checkForExistingPackageJson()
    }
  ]
}

function checkForExistingPackageJson() {
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    throw new Error(
      `A package.json already exists in this directory.\n` +
      `Please remove it or use an empty directory.`
    );
  }
}

async function scaffoldProject(ctx, options, cwd) {
  const connectionString = parseConnectionString(options.db);
  const provider = detectDbProvider(connectionString.protocol);
  const prismaDbUrl = generateDbUrlForPrisma(connectionString);

  ctx.skipPrismaSetup = !prismaDbUrl;
  const appName = options.appName;

  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  // Prepare directories
  ctx.customDir = path.join(cwd, 'custom');
  await fse.ensureDir(ctx.customDir);
  await fse.ensureDir(path.join(cwd, 'resources'));

  // Copy static assets to `custom/assets`
  const sourceAssetsDir = path.join(dirname, 'assets');
  const targetAssetsDir = path.join(ctx.customDir, 'assets');
  await fse.ensureDir(targetAssetsDir);
  await fse.copy(sourceAssetsDir, targetAssetsDir);

  // Write templated files
  writeTemplateFiles(dirname, cwd, {
    dbUrl: connectionString.toString(),
    prismaDbUrl,
    appName,
    provider,
  });

}

async function writeTemplateFiles(dirname, cwd, options) {
  const { dbUrl, prismaDbUrl, appName, provider } = options;

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
      src: 'package.json.hbs',
      dest: 'package.json',
      data: { appName },
    },
    {
      src: 'index.ts.hbs',
      dest: 'index.ts',
      data: { appName },
    },
    {
      src: '.gitignore.hbs',
      dest: '.gitignore',
      data: {},
    },
    {
      src: '.env.sample.hbs',
      dest: '.env.sample',
      data: { dbUrl, prismaDbUrl },
    },
    {
      // We'll write .env using the same content as .env.sample
      src: '.env.sample.hbs',
      dest: '.env',
      data: { dbUrl, prismaDbUrl },
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
  ];

  for (const task of templateTasks) {
    // If a condition is specified and false, skip this file
    if (task.condition === false) continue;

    const templatePath = path.join(dirname, 'templates', task.src);
    const compiled = renderHBSTemplate(templatePath, task.data);
    const destPath = path.join(cwd, task.dest);
    // Ensure parent directory exists
    // fse.ensureDirSync(path.dirname(destPath));
    fs.writeFileSync(destPath, compiled);
  }
}

async function installDependencies(ctx, cwd) {
  const customDir = ctx.customDir;

  await Promise.all([
    await execa('npm', ['install', '--no-package-lock'], { cwd }),
    await execa('npm', ['install'], { cwd: customDir }),
  ]);
}

function generateFinalInstructions(skipPrismaSetup) {
  let instruction = '⏭️  Run the following commands to get started:\n';
  if (!skipPrismaSetup)
    instruction += `
  ${chalk.dim('// runs "npx prisma migrate dev --name init" to generate and apply initial migration')};
  ${chalk.cyan('$ npm run makemigration -- --name init')}\n`;

  instruction += `
  ${chalk.dim('// Starts dev server with tsx watch for hot-reloading')}
  ${chalk.cyan('$ npm start')}\n
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
          initialChecks(),
          { concurrent: true },
        )
    },
    {
      title: '🚀 Scaffolding your project...',
      task: async (ctx) => scaffoldProject(ctx, options, cwd)
    },
    {
      title: '📦 Installing dependencies...',
      task: async (ctx) => installDependencies(ctx, cwd)
    },
    {
      title: '📝 Preparing final instructions...',
      task: (ctx) => {
        console.log(chalk.green(`✅ Successfully created your new Adminforth project!\n`));
        console.log(generateFinalInstructions(ctx.skipPrismaSetup));
        console.log('\n\n');
    }
  }],
  {
    rendererOptions: {collapseSubtasks: false},
    concurrent: false,
    exitOnError: true,
    collectErrors: true,
  }
);

  return tasks;
}
