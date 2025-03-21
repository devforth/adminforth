import chalk from "chalk";

import {
  parseArgumentsIntoOptions,
  prepareWorkflow,
  promptForMissingOptions,
} from "./utils.js";

export default async function createPlugin(args) {
  // Step 1: Parse CLI arguments with `arg`
  let options = parseArgumentsIntoOptions(args);

  // Step 2: Ask for missing arguments via `inquirer`
  options = await promptForMissingOptions(options);

  // Step 3: Prepare a Listr-based workflow
  const tasks = prepareWorkflow(options);

  // Step 4: Run tasks
  try {
    await tasks.run();
  } catch (err) {
    console.error(chalk.red(`\n❌  ${err.message}\n`));
    process.exit(1);
  }
}
