import arg from 'arg';
import chalk from 'chalk';
import fs from 'fs';
import fse from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { Listr } from 'listr2';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import Handlebars from 'handlebars';

export function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      "--plugin-name": String,
      // you can add more flags here if needed
    },
    {
      argv: rawArgs.slice(1), // skip "create-plugin"
    }
  );

  return {
    pluginName: args["--plugin-name"],
  };
}

export async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.pluginName) {
    questions.push({
      type: "input",
      name: "pluginName",
      message: "Please specify the name of the plugin >",
      default: "adminforth-plugin",
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    pluginName: options.pluginName || answers.pluginName,
  };
}

function checkNodeVersion(minRequiredVersion = 20) {
  const current = process.versions.node.split(".");
  const major = parseInt(current[0], 10);

  if (isNaN(major) || major < minRequiredVersion) {
    throw new Error(
      `Node.js v${minRequiredVersion}+ is required. You have ${process.versions.node}. ` +
        `Please upgrade Node.js. We recommend using nvm for managing multiple Node.js versions.`
    );
  }
}

function checkForExistingPackageJson() {
  if (fs.existsSync(path.join(process.cwd(), "package.json"))) {
    throw new Error(
      `A package.json already exists in this directory.\n` +
        `Please remove it or use an empty directory.`
    );
  }
}

function initialChecks() {
  return [
    {
      title: "👀 Checking Node.js version...",
      task: () => checkNodeVersion(20),
    },
    {
      title: "👀 Validating current working directory...",
      task: () => checkForExistingPackageJson(),
    },
  ];
}

function renderHBSTemplate(templatePath, data) {
  const template = fs.readFileSync(templatePath, "utf-8");
  const compiled = Handlebars.compile(template);
  return compiled(data);
}

async function scaffoldProject(ctx, options, cwd) {
  const pluginName = options.pluginName;

  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  // Prepare directories
  ctx.customDir = path.join(cwd, "custom");
  await fse.ensureDir(ctx.customDir);

  // Write templated files
  await writeTemplateFiles(dirname, cwd, {
    pluginName,
  });
}

async function writeTemplateFiles(dirname, cwd, options) {
  const { pluginName } = options;

  // Build a list of files to generate
  const templateTasks = [
    {
      src: "tsconfig.json.hbs",
      dest: "tsconfig.json",
      data: {},
    },
    {
      src: "package.json.hbs",
      dest: "package.json",
      data: { pluginName },
    },
    {
      src: "index.ts.hbs",
      dest: "index.ts",
      data: {},
    },
    {
      src: ".gitignore.hbs",
      dest: ".gitignore",
      data: {},
    },
    {
      src: "types.ts.hbs",
      dest: "types.ts",
      data: {},
    },
    {
      src: "custom/tsconfig.json.hbs",
      dest: "custom/tsconfig.json",
      data: {},
    },
  ];

  for (const task of templateTasks) {
    // If a condition is specified and false, skip this file
    if (task.condition === false) continue;

    const destPath = path.join(cwd, task.dest);
    fse.ensureDirSync(path.dirname(destPath));

    if (task.empty) {
      fs.writeFileSync(destPath, "");
    } else {
      const templatePath = path.join(dirname, "templates", task.src);
      const compiled = renderHBSTemplate(templatePath, task.data);
      fs.writeFileSync(destPath, compiled);
    }
  }
}

async function installDependencies(ctx, cwd) {
  const customDir = ctx.customDir;

  await Promise.all([
    await execa("npm", ["install", "--no-package-lock"], { cwd }),
    await execa("npm", ["install"], { cwd: customDir }),
  ]);
}

function generateFinalInstructions() {
  let instruction = "⏭️  Your plugin is ready! Next steps:\n";

  instruction += `
  ${chalk.dim("// Build your plugin")}
  ${chalk.cyan("$ npm run build")}\n`;

  instruction += `
  ${chalk.dim("// To test your plugin locally")}
  ${chalk.cyan("$ npm link")}\n`;

  instruction += `
  ${chalk.dim("// In your AdminForth project")}
  ${chalk.cyan("$ npm link " + chalk.italic("your-plugin-name"))}\n`;

  instruction += "\n😉 Happy coding!";

  return instruction;
}

export function prepareWorkflow(options) {
  const cwd = process.cwd();
  const tasks = new Listr(
    [
      {
        title: "🔍 Initial checks...",
        task: (_, task) => task.newListr(initialChecks(), { concurrent: true }),
      },
      {
        title: "🚀 Scaffolding your plugin...",
        task: async (ctx) => scaffoldProject(ctx, options, cwd),
      },
      {
        title: "📦 Installing dependencies...",
        task: async (ctx) => installDependencies(ctx, cwd),
      },
      {
        title: "📝 Preparing final instructions...",
        task: (ctx) => {
          console.log(
            chalk.green(`✅ Successfully created your new AdminForth plugin!\n`)
          );
          console.log(generateFinalInstructions());
          console.log("\n\n");
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false },
      concurrent: false,
      exitOnError: true,
      collectErrors: true,
    }
  );

  return tasks;
}
