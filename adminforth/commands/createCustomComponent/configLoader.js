import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import jiti from 'jiti';


export async function loadAdminForthConfig() {
  const configFileName = 'index.ts';
  const configPath = path.resolve(process.cwd(), configFileName);

  try {
    await fs.access(configPath);
  } catch (error) {
    console.error(chalk.red(`\nError: Configuration file not found at ${configPath}`));
    console.error(chalk.yellow(`Please ensure you are running this command from your project's root directory and the '${configFileName}' file exists.`));
    process.exit(1);
  }

  try {
    const _require = jiti(import.meta.url, {
        interopDefault: true,
        cache: true,
        esmResolve: true,
    });

    const configModule = _require(configPath);

    const adminInstance = configModule.admin || configModule.default?.admin;


    if (!adminInstance) {
        throw new Error(`Could not find 'admin' export in ${configFileName}. Please ensure your config file exports the AdminForth instance like: 'export const admin = new AdminForth({...});'`);
    }

    const config = adminInstance.config;

    if (!config || typeof config !== 'object') {
        throw new Error(`Invalid configuration found in admin instance from ${configFileName}. Expected admin.config to be an object.`);
    }

    if (!config.resources || !Array.isArray(config.resources)) {
        console.warn(chalk.yellow(`Warning: The loaded configuration seems incomplete. Missing 'resources' array.`));
    }
     if (!config.customization?.customComponentsDir) {
        console.warn(chalk.yellow(`Warning: 'customization.customComponentsDir' is not defined in the config. Defaulting might occur elsewhere, but defining it is recommended.`));
     }


    console.log(chalk.dim(`Loaded configuration from ${configPath}`));
    return config;

  } catch (error) {
    console.error(chalk.red(`\nError loading or parsing configuration file: ${configPath}`));
    console.error(error);
    process.exit(1);
  }
}
