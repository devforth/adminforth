#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

import bundle from "./bundle.js";
import createApp from "./createApp/main.js";
import generateModels from "./generateModels.js";
import createPlugin from "./createPlugin/main.js";
import createComponent from "./createCustomComponent/main.js";
import createResource from "./createResource/main.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

function showHelp() {
  console.log(
    chalk.white("Available commands:\n") +
    chalk.green('  create-app') + chalk.white('         Create a new AdminForth app\n') +
    chalk.green('  create-plugin') + chalk.white('      Create a plugin for your AdminForth app\n') +
    chalk.green('  generate-models') + chalk.white('    Generate TypeScript models from your databases\n') +
    chalk.green('  bundle') + chalk.white('             Bundles your AdminForth app SPA for production\n') +
    chalk.green('  component') + chalk.white('          Scaffold a custom Vue component\n') +
    chalk.green('  resource') + chalk.white('            Scaffold a custom resource\n')
  );
}

export function currentFileDir(importMetaUrl) {
  const filePath = importMetaUrl.replace(`file:${path.sep}${path.sep}`, "");
  const fileDir = path.dirname(filePath);
  return fileDir;
}

export function getVersion() {
  const ADMIN_FORTH_ABSOLUTE_PATH = path.join(currentFileDir(import.meta.url), '..');
  
  const package_json = JSON.parse(fs.readFileSync(path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'package.json'), 'utf8'));
  
  const ADMINFORTH_VERSION  = package_json.version;

  return ADMINFORTH_VERSION;
}

function showVersion() {
  const ADMINFORTH_VERSION = getVersion();

  console.log(
    chalk.white('AdminForth CLI version: ') +
    chalk.cyan.bold(ADMINFORTH_VERSION)
  );
}

switch (command) {
  case "create-app":
    createApp(args);
    break;
  case "create-plugin":
    createPlugin(args);
    break;
  case "generate-models":
    generateModels();
    break;
  case "bundle":
    bundle();
    break;
  case "component":
    createComponent(args);
    break;
  case "resource":
    createResource(args);
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  case "--version":
  case "version":
  case "-v":
    showVersion();
    break;
  default: {
    console.log(
      "Unknown command."
    );
    showHelp();
  }
}
