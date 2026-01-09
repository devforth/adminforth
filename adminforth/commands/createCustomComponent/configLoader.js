import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import jiti from 'jiti';
import dotenv, { config } from "dotenv";
import { afLogger } from '../modules/logger.js';

dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env', override: true });

export async function getAdminInstance() {
  const configFileName = 'index.ts';
  const configPath = path.resolve(process.cwd(), configFileName);
  try {
    await fs.access(configPath);
  } catch (error) {
    console.error(chalk.red(`\nError: Configuration file not found at ${configPath}`));
    console.error(chalk.yellow(`Please ensure you are running this command from your project's root directory and the '${configFileName}' file exists.`));
    return null;
  }

  try {
    const _require = jiti(import.meta.url, {
        interopDefault: true,
        cache: true,
        esmResolve: true,
    });

    const configModule = _require(configPath);

    const adminInstance = configModule.admin || configModule.default?.admin;
    return { adminInstance, configPath, configFileName };
  } catch (error) {
    console.error(chalk.red(`\nError loading or parsing configuration file: ${configPath}`));
    console.error(error);
    return null;
  }
}

export async function loadAdminForthConfig() {
  
  const { adminInstance, configPath, configFileName } = await getAdminInstance();

  try {
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


    afLogger.info(chalk.dim(`Loaded configuration from ${configPath}`));
    return config;

  } catch (error) {
    afLogger.error(chalk.red(`\nError loading or parsing configuration file: ${configPath},  error: ${error}`));
    afLogger.error(error);
    process.exit(1);
  }
}
