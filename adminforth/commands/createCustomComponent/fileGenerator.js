import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

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
  const componentName = `${resource.label}${column.label}${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`;
  const columnName = column.name;
  const resourceId = resource.resourceId;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, 'templates', 'customFields', `${fieldType}.vue.hbs`);

  console.log(chalk.dim(`Using template: ${templatePath}`));

  const context = {
    componentName,
    columnName,
    resourceId,
    resource,
    column
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

  try {
    await fs.mkdir(customDirPath, { recursive: true });
    console.log(chalk.dim(`Ensured custom directory exists: ${customDirPath}`));

    const fileContent = await generateVueContent(fieldType, context);

    await fs.writeFile(absoluteComponentPath, fileContent, 'utf-8');
    console.log(chalk.green(`✅ Generated component file: ${absoluteComponentPath}`));

    return absoluteComponentPath;

  } catch (error) {
    console.error(chalk.red(`❌ Error creating component file at ${absoluteComponentPath}:`));
    if (!error.message.includes('template')) {
       console.error(error);
    }
    throw error;
  }
}
