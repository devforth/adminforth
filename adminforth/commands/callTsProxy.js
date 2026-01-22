// callTsProxy.js
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import dotenv from "dotenv";

const currentFilePath = import.meta.url;
const currentFileFolder = path.dirname(currentFilePath).replace("file:", "");

export function callTsProxy(tsCode, silent=false) {

  const currentDirectory = process.cwd();
  const envPath = path.resolve(currentDirectory, ".env");
  const envLocalPath = path.resolve(currentDirectory, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  }
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  process.env.HEAVY_DEBUG && console.log("🌐 Calling tsproxy with code:", path.join(currentFileFolder, "proxy.ts"));
  return new Promise((resolve, reject) => {
    const child = spawn("tsx", [path.join(currentFileFolder, "proxy.ts")], {
      env: process.env,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data;
    });

    child.stderr.on("data", (data) => {
      stderr += data;
    });

    child.on("close", (code) => {
      if (code === 0) {
        try {
          const preparedStdout = stdout.slice(stdout.indexOf("{"), stdout.lastIndexOf("}") + 1);
          const parsed = JSON.parse(preparedStdout);
          if (!silent) {
            parsed.capturedLogs.forEach((log) => {
              console.log(...log);
            });
          }

          if (parsed.error) {
            reject(new Error(`${parsed.error}\n${parsed.stack}`));
          }
          resolve(parsed.result);
        } catch (e) {
          reject(new Error("Invalid JSON from tsproxy: " + stdout));
        }
      } else {
        console.error(`tsproxy exited with non-0, this should never happen, stdout: ${stdout}, stderr: ${stderr}`);
        reject(new Error(stderr));
      }
    });

    process.env.HEAVY_DEBUG && console.log("🪲 Writing to tsproxy stdin...\n'''", tsCode, "'''");
    child.stdin.write(tsCode);
    child.stdin.end();
  });
}

export async function findAdminInstance() {
  process.env.HEAVY_DEBUG && console.log("🌐 Finding admin instance...");
  const currentDirectory = process.cwd();

  let files = fs.readdirSync(currentDirectory);
  let instanceFound = {
    file: null,
    version: null,
  };
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
        const res = await callTsProxy(`
          import { admin } from './${fileNoTs}.js';

          export async function exec() {
            return admin.formatAdminForth();
          }
        `, true);
        instanceFound.file = fileNoTs;
        instanceFound.version = res;
        break;

      } catch (e) {
        // do our best to guess that this file has a good chance to be admin instance
        // and show the error so user can fix it
        const fileContent = fs.readFileSync(file, "utf-8");
        if (fileContent.includes("export const admin")) {
          console.error(chalk.red(`Error running ${file}:`, e));
          process.exit(1);
        }
        process.env.HEAVY_DEBUG && console.log(`🪲 File ${file} failed`, e);
      }
    }
  }
  if (!instanceFound.file) {
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
    process.exit(1);
  }
  return instanceFound;
}

// Example usage:
// callTsProxy(`
//   import admin from './admin';
//   function exec() {
//     return admin.doX();
//   }
// `).then(console.log).catch(console.error);
