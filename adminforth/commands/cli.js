#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

import bundle from "./bundle.js";
import createApp from "./createApp/main.js";
import generateModels from "./generateModels.js";
import createPlugin from "./createPlugin/main.js";
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
  default:
    console.log(
      "Unknown command. Available commands: create-app, create-plugin, generate-models, bundle"
    );
}
