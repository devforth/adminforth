import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import { afLogger } from '../modules/logger.js';

async function renderHBSTemplate(templatePath, data) {
  try {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(templateContent);
    return compiled(data);
  } catch (error) {
    console.error(chalk.red(`❌ Error reading or compiling template: ${templatePath}`));
    throw error;
  }
}

async function generateVueContent(fieldType, { resource, column }) {
  const hasColumn = !!column;
  const componentName = hasColumn
    ? `${resource.label}${column.label}${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`
    : `${resource.label}${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`;

  const resourceId = resource.resourceId;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const templatePath = hasColumn
    ? path.join(__dirname, 'templates', 'customFields', `${fieldType}.vue.hbs`)
    : path.join(__dirname, 'templates', 'customCrud', `${fieldType}.vue.hbs`);

  afLogger.info(chalk.dim(`Using template: ${templatePath}`));

  const context = {
    componentName,
    resourceId,
    resource,
    ...(hasColumn && {
      column,
      columnName: column.name,
    }),
  };

  try {
    const fileContent = await renderHBSTemplate(templatePath, context);
    return fileContent;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to generate content for ${componentName}.vue`));
    throw error;
  }
}


export async function generateComponentFile(componentFileName, fieldType, context, config) {

  const customDirRelative = 'custom';

  const projectRoot = process.cwd();
  const customDirPath = path.resolve(projectRoot, customDirRelative);
  const absoluteComponentPath = path.resolve(customDirPath, componentFileName);
  if (fsSync.existsSync(absoluteComponentPath)) {
    afLogger.warn(chalk.yellow(`⚠️ Component file already exists: ${absoluteComponentPath}`));
    return {"alreadyExists": true, "path": absoluteComponentPath}
  }
  try {
    await fs.mkdir(customDirPath, { recursive: true });
    afLogger.info(chalk.dim(`Ensured custom directory exists: ${customDirPath}`));

    const fileContent = await generateVueContent(fieldType, context);

    await fs.writeFile(absoluteComponentPath, fileContent, 'utf-8');
    afLogger.info(chalk.green(`✅ Generated component file: ${absoluteComponentPath}`));

    return {"alreadyExists": false, "path": absoluteComponentPath}

  } catch (error) {
    afLogger.error(chalk.red(`❌ Error creating component file at ${absoluteComponentPath}:`));
    if (!error.message.includes('template')) {
       afLogger.error(error);
    }
    throw error;
  }
}

export async function generateCrudInjectionComponent(componentFileName, crudType, context, config) {
  const customDirRelative = 'custom';
  const projectRoot = process.cwd();
  const customDirPath = path.resolve(projectRoot, customDirRelative);
  const absoluteComponentPath = path.resolve(customDirPath, componentFileName);

  if (fsSync.existsSync(absoluteComponentPath)) {
    afLogger.warn(chalk.yellow(`⚠️ Component file already exists: ${absoluteComponentPath}`));
    return { alreadyExists: true, path: absoluteComponentPath };
  }

  try {
    await fs.mkdir(customDirPath, { recursive: true });
    afLogger.warn(chalk.dim(`Ensured custom directory exists: ${customDirPath}`));

    const fileContent = await generateVueContent(crudType, context);

    await fs.writeFile(absoluteComponentPath, fileContent, 'utf-8');
    afLogger.info(chalk.green(`✅ Generated component file: ${absoluteComponentPath}`));

    return { alreadyExists: false, path: absoluteComponentPath };
  } catch (error) {
    afLogger.error(chalk.red(`❌ Error creating component file at ${absoluteComponentPath}:`));
    throw error;
  }
}

export async function generateLoginOrGlobalComponentFile(componentFileName, injectionType, context) {
  const customDirRelative = 'custom';
  const projectRoot = process.cwd();
  const customDirPath = path.resolve(projectRoot, customDirRelative);
  const absoluteComponentPath = path.resolve(customDirPath, componentFileName);

  if (fsSync.existsSync(absoluteComponentPath)) {
    afLogger.warn(chalk.yellow(`⚠️ Component file already exists: ${absoluteComponentPath}`));
    return { alreadyExists: true, path: absoluteComponentPath };
  }

  try {
    await fs.mkdir(customDirPath, { recursive: true });
    afLogger.info(chalk.dim(`Ensured custom directory exists: ${customDirPath}`));

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    let templatePath;
    if (injectionType === 'afterLogin' || injectionType === 'beforeLogin') {
      templatePath = path.join(__dirname, 'templates', 'login', `${injectionType}.vue.hbs`);
    } else {
      templatePath = path.join(__dirname, 'templates', 'global', `${injectionType}.vue.hbs`);
    }

    const fileContent = await renderHBSTemplate(templatePath, context);

    await fs.writeFile(absoluteComponentPath, fileContent, 'utf-8');
    afLogger.info(chalk.green(`✅ Generated login injection component: ${absoluteComponentPath}`));

    return { alreadyExists: false, path: absoluteComponentPath };
  } catch (error) {
    afLogger.error(chalk.red(`❌ Error creating login component at ${absoluteComponentPath}`));
    throw error;
  }
}
