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
import { fileURLToPath } from 'url';

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
  const filePath = fileURLToPath(importMetaUrl);
  const fileDir = path.dirname(filePath);
  return fileDir;
}

export function getVersion() {
  const ADMIN_FORTH_ABSOLUTE_PATH = path.join(currentFileDir(import.meta.url), '..');
  
  const package_json = JSON.parse(fs.readFileSync(path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'package.json'), 'utf8'));
  
  const ADMINFORTH_VERSION  = package_json.version;

  return ADMINFORTH_VERSION;
}

/**
 * Resolves the adminforth version range to write into a scaffolded package.json.
 *
 * Returns a caret range pinned to the latest published release of the dist-tag
 * matching the running CLI, e.g. "^3.6.12" (installs the latest 3.x.x, never a
 * major upgrade). For "next" builds the moving "next" tag is kept, since
 * prerelease versions do not caret cleanly. Falls back to a major-only range
 * (e.g. "^3.0.0"), and finally to "latest", when the registry is unreachable.
 */
export async function resolveAdminforthVersionRange() {
  // Determine which dist-tag matches the CLI currently running, and derive an
  // offline fallback range from the CLI's own major version.
  let tag = 'latest';
  let offlineFallback = 'latest';
  try {
    const version = getVersion();
    if (typeof version === 'string') {
      if (version.includes('next')) {
        tag = 'next';
      }
      const major = version.split('.')[0];
      if (/^\d+$/.test(major)) {
        offlineFallback = `^${major}.0.0`;
      }
    }
  } catch {
    // Ignore; fall back to "latest" below.
  }

  // "next" builds keep the moving tag — prerelease versions don't caret cleanly.
  if (tag === 'next') {
    return 'next';
  }

  try {
    const res = await fetch('https://registry.npmjs.org/-/package/adminforth/dist-tags', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`registry responded with ${res.status}`);
    }
    const distTags = await res.json();
    const latest = distTags[tag];
    if (typeof latest !== 'string' || !/^\d+\.\d+\.\d+/.test(latest)) {
      throw new Error('invalid version received from registry');
    }
    return `^${latest}`;
  } catch (err) {
    console.warn(
      `⚠️ Could not resolve AdminForth version from npm registry (${err.message}); defaulting to "${offlineFallback}".`
    );
    return offlineFallback;
  }
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
