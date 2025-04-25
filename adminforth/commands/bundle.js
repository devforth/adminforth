import fs from "fs";
import { callTsProxy } from "./callTsProxy.js";
import chalk from "chalk";

async function bundle() {
  console.log("Bundling admin SPA...");
  const currentDirectory = process.cwd();

  let files = fs.readdirSync(currentDirectory);
  let instanceFound = false;
  // try index.ts first
  if (files.includes("index.ts")) {
    files = files.filter((file) => file !== "index.ts");
    files.unshift("index.ts");
  }
    
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const fileNoTs = file.replace(/\.ts$/, "");
      process.env.HEAVY_DEBUG && console.log(`🪲 Trying bundleing ${file}...`);
      try {
        await callTsProxy(`
          import { admin } from './${fileNoTs}.js';

          export async function exec() {
            return await admin.bundleNow({ hotReload: false });
          }
        `);
        instanceFound = true;
        break;

      } catch (e) {
        process.env.HEAVY_DEBUG && console.log(`🪲 File ${file} failed`, e);
      }
    }
  }
  if (!instanceFound) {
    console.error(
      chalk.red(
        `Error: No valid instance found to bundle.\n` +
        `Make sure you have a file in the current directory with a .ts extension, and it exports an ` +
        chalk.cyan.bold('admin') +
        ` instance like:\n\n` +
        chalk.yellow('export const admin = new AdminForth({...})') +
        `\n\nFor example, adminforth CLI creates an index.ts file which exports the admin instance.`
      )
    );
    return;
  }
}

export default bundle;
