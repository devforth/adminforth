import fs from "fs";
import { getInstance } from "./utils.js";

async function bundle() {
  const currentDirectory = process.cwd();
  const files = fs.readdirSync(currentDirectory);
  let instanceFound = false;

  for (const file of files) {
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      try {
        const instance = await getInstance(file, currentDirectory);
        if (instance) {
          await instance.bundleNow({ hotReload: false });
          instanceFound = true;
          break;
        }
      } catch (error) {
        console.error(`Error: Could not bundle '${file}'`, error);
      }
    }
  }
  if (!instanceFound) {
    console.error("Error: No valid instance found to bundle.");
    return;
  }
}

export default bundle;
