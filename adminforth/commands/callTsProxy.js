// callTsProxy.js
import { spawn } from "child_process";
import path from "path";

const currentFilePath = import.meta.url;
const currentFileFolder = path.dirname(currentFilePath).replace("file:", "");

export function callTsProxy(tsCode) {

  process.env.HEAVY_DEBUG && console.log("🌐 Calling tsproxy with code:", path.join(currentFileFolder, "proxy.ts"));
  return new Promise((resolve, reject) => {
    const child = spawn("tsx", [
      path.join(currentFileFolder, "proxy.ts")
    ]);

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
          const parsed = JSON.parse(stdout);
          parsed.capturedLogs.forEach((log) => {
            console.log(...log);
          });
          resolve(parsed.result);
        } catch (e) {
          reject(new Error("Invalid JSON from tsproxy: " + stdout));
        }
      } else {
        try {
          const parsedError = JSON.parse(stderr);
          process.env.HEAVY_DEBUG && console.error("🪲 Error from tsproxy. Captured logs:", parsedError.capturedLogs);
          reject(new Error(parsedError.error));
        } catch (e) {
          reject(new Error(stderr));
        }
      }
    });

    process.env.HEAVY_DEBUG && console.log("🪲 Writing to tsproxy stdin...\n'''", tsCode, "'''");
    child.stdin.write(tsCode);
    child.stdin.end();
  });
}


// Example usage:
// callTsProxy(`
//   import admin from './admin';
//   function exec() {
//     return admin.doX();
//   }
// `).then(console.log).catch(console.error);
