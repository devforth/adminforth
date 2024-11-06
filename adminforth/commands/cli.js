#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

import generateModels from "./generateModels.js";
import bundle from "./bundle.js";

switch (command) {
  case "generate-models":
    generateModels();
    break;
  case "bundle":
    bundle();
    break;
  default:
    console.log("Unknown command. Available commands: generate-models, bundle");
}
