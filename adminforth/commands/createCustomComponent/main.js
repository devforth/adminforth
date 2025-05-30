import { select, Separator, search, input } from '@inquirer/prompts';
import chalk from 'chalk';// Import path
import path from 'path';
import { loadAdminForthConfig } from './configLoader.js'; // Helper to load config
import { generateComponentFile, generateLoginOrGlobalComponentFile, generateCrudInjectionComponent } from './fileGenerator.js'; // Helper to create the .vue file
import { updateResourceConfig, injectLoginComponent, injectGlobalComponent, updateCrudInjectionConfig } from './configUpdater.js'; // Helper to modify resource .ts file

function sanitizeLabel(input){
  return input
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) 
    .join('');
}

export default async function createComponent(args) {
  console.log('This command will help you to generate boilerplate for component.\n');

  const config = await loadAdminForthConfig();
  const resources = config.resources; 

  const componentType = await select({
    message: 'What component type would you like to add?',
    choices: [
      { name: `🔤 Custom fields ${chalk.grey('fields')}`, value: 'fields' },
      { name: `➖ CRUD page injections ${chalk.grey('crudPage')}`, value: 'crudPage' },
      { name: `🔐 Login page injections ${chalk.grey('login')}`, value: 'login' },
      { name: `🌐 Global Injections ${chalk.grey('global')}`, value: 'global' },
    ],
  });

  if (componentType === 'fields') {
    await handleFieldComponentCreation(config, resources);
  } else if (componentType === 'crudPage') {
    await handleCrudPageInjectionCreation(config, resources);
  } else if (componentType === 'login') {
    await handleLoginPageInjectionCreation(config);
  } else if (componentType === 'global') {
    await handleGlobalInjectionCreation(config);
  }
}

async function handleFieldComponentCreation(config, resources) {
  console.log(chalk.grey('Selected ❯ 🔤 Custom fields'));

  const fieldType = await select({
      message: 'What view component would you like to add?',
      choices: [
          { name: '🔸 list', value: 'list' },
          { name: '📃 show', value: 'show' },
          { name: '✏️ edit', value: 'edit' },
          { name: '➕ create', value: 'create' },
          new Separator(),
          { name: '🔙 BACK', value: '__BACK__' },
      ]
  });
  if (fieldType === '__BACK__') return createComponent([]); // Go back to main menu

  console.log(chalk.grey(`Selected ❯ 🔤 Custom fields ❯ ${fieldType}`));

  const resourceId = await select({
      message: 'Select resource for which you want to change component:',
      choices: [
          ...resources.map(r => ({ name: `${r.label} ${chalk.grey(`${r.resourceId}`)}`, value: r.resourceId })),
          new Separator(),
          { name: '🔙 BACK', value: '__BACK__' },
      ]
  });
   if (resourceId === '__BACK__') return handleFieldComponentCreation(config, resources); // Pass config back

  const selectedResource = resources.find(r => r.resourceId === resourceId);
  console.log(chalk.grey(`Selected ❯ 🔤 Custom fields ❯ ${fieldType} ❯ ${selectedResource.label}`));

  const columnName = await search({
    message: 'Select column for which you want to create component:',
    source: async (input) => {
      const searchTerm = input ? input.toLowerCase() : '';

      const filteredColumns = selectedResource.columns.filter(c => {
        const label = c.label || ''; 
        const name = c.name || '';
        return label.toLowerCase().includes(searchTerm) || name.toLowerCase().includes(searchTerm);
      });

      return [
        ...filteredColumns.map(c => ({ name: `${c.label} ${chalk.grey(`${c.name}`)}`, value: c.name })),
        new Separator(),
        { name: '🔙 BACK', value: '__BACK__' },
      ];
    },
  });
  if (columnName === '__BACK__') return handleFieldComponentCreation(config, resources); // Pass config back

  const selectedColumn = selectedResource.columns.find(c => c.name === columnName);
   console.log(chalk.grey(`Selected ❯ 🔤 Custom fields ❯ ${fieldType} ❯ ${selectedResource.label} ❯ ${selectedColumn.label}`));
   console.log(chalk.dim(`One-line alternative: |adminforth component fields.${fieldType}.${resourceId}.${columnName}|`));


  const safeResourceLabel = sanitizeLabel(selectedResource.label)
  const safeColumnLabel = sanitizeLabel(selectedColumn.label)
  const componentFileName = `${safeResourceLabel}${safeColumnLabel}${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}.vue`; // e.g., UserEmailShow.vue
  const componentPathForConfig = `@@/${componentFileName}`; // Path relative to custom dir for config

  
  try {
    const { alreadyExists, path: absoluteComponentPath } = await generateComponentFile(
      componentFileName,
      fieldType,
      { resource: selectedResource, column: selectedColumn },
      config
    );
    if (!alreadyExists) {
      console.log(chalk.dim(`Component generation successful: ${absoluteComponentPath}`));

      await updateResourceConfig(selectedResource.resourceId, columnName, fieldType, componentPathForConfig);
      console.log(
        chalk.bold.greenBright('You can now open the component in your IDE:'),
        chalk.underline.cyanBright(absoluteComponentPath)
      );
    }
    process.exit(0);
}catch (error) {
  console.error(error);
  console.error(chalk.red('\n❌ Component creation failed. Please check the errors above.'));
  process.exit(1);
}
}

async function handleCrudPageInjectionCreation(config, resources) {
  console.log(chalk.grey('Selected ❯ 📄 CRUD Page Injection'));

  const crudType = await select({
    message: 'What view do you want to inject a custom component into?',
    choices: [
      { name: '🔸 list', value: 'list' },
      { name: '📃 show', value: 'show' },
      { name: '✏️ edit', value: 'edit' },
      { name: '➕ create', value: 'create' },
      new Separator(),
      { name: '🔙 BACK', value: '__BACK__' },
    ],
  });
  if (crudType === '__BACK__') return createComponent([]);

  console.log(chalk.grey(`Selected ❯ 📄 CRUD Page Injection ❯ ${crudType}`));

  const resourceId = await select({
    message: 'Select resource for which you want to inject the component:',
    choices: [
      ...resources.map(r => ({ name: `${r.label} ${chalk.grey(`${r.resourceId}`)}`, value: r.resourceId })),
      new Separator(),
      { name: '🔙 BACK', value: '__BACK__' },
    ],
  });
  if (resourceId === '__BACK__') return handleCrudPageInjectionCreation(config, resources);

  const selectedResource = resources.find(r => r.resourceId === resourceId);
  console.log(chalk.grey(`Selected ❯ 📄 CRUD Page Injection ❯ ${crudType} ❯ ${selectedResource.label}`));

  const injectionPosition = await select({
    message: 'Where exactly do you want to inject the component?',
    choices: [
      { name: '⬆️ Before Breadcrumbs', value: 'beforeBreadcrumbs' },
      { name: '⬇️ After Breadcrumbs', value: 'afterBreadcrumbs' },
      { name: '📄 After Page', value: 'bottom' },
      { name: '⋯ threeDotsDropdownItems', value: 'threeDotsDropdownItems' },
      new Separator(),
      { name: '🔙 BACK', value: '__BACK__' },
    ],
  });
  if (injectionPosition === '__BACK__') return handleCrudPageInjectionCreation(config, resources);

  const additionalName = await input({
    message: 'Enter additional name (optional, e.g., "CustomExport"):',
    validate: (value) => {
      if (!value) return true;
      return /^[A-Za-z0-9_-]+$/.test(value) || 'Only alphanumeric characters, hyphens or underscores are allowed.';
    },
  });

  const isThin = await select({
    message: 'Will this component be thin enough to fit on the same page with list (so list will still shrink)?',
    choices: [
      { name: 'Yes', value: true },
      { name: 'No', value: false },
    ],
  });
  const formattedAdditionalName = additionalName
    ? additionalName[0].toUpperCase() + additionalName.slice(1)
    : '';
  const safeResourceLabel = sanitizeLabel(selectedResource.label)
  const componentFileName = `${safeResourceLabel}${crudType.charAt(0).toUpperCase() + crudType.slice(1)}${injectionPosition.charAt(0).toUpperCase() + injectionPosition.slice(1) + formattedAdditionalName}.vue`;
  const componentPathForConfig = `@@/${componentFileName}`;

  try {
    const { alreadyExists, path: absoluteComponentPath } = await generateCrudInjectionComponent(
      componentFileName,
      injectionPosition,
      { resource: selectedResource },
      config
    );

    if (!alreadyExists) {
      console.log(chalk.dim(`Component generation successful: ${absoluteComponentPath}`));

      await updateCrudInjectionConfig(
        selectedResource.resourceId,
        crudType,
        injectionPosition,
        componentPathForConfig,
        isThin
      );
      console.log(
        chalk.bold.greenBright('You can now open the component in your IDE:'),
        chalk.underline.cyanBright(absoluteComponentPath)
      );
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    console.error(chalk.red('\n❌ Component creation failed. Please check the errors above.'));
    process.exit(1);
  }
}


async function handleLoginPageInjectionCreation(config) { 
  console.log('Selected ❯ 🔐 Login page injections');
  const injectionType = await select({
    message: 'Select injection type:',
    choices: [
      { name: 'After Login and password inputs', value: 'afterLogin' },
      { name: '🔙 BACK', value: '__BACK__' },
    ],
  });
  if (injectionType === '__BACK__') return createComponent([]);

  console.log(chalk.grey(`Selected ❯ 🔐 Login page injections ❯ ${injectionType}`));

  const reason = await input({
    message: 'What will you need component for? (enter name)',
  });

  console.log(chalk.grey(`Selected ❯ 🔐 Login page injections ❯ ${injectionType} ❯ ${reason}`));


  try {
    const safeName = sanitizeLabel(reason)
    const componentFileName = `CustomLogin${safeName}.vue`;
  
    const context = { reason };
  
    const { alreadyExists, path: absoluteComponentPath } = await generateLoginOrGlobalComponentFile(
      componentFileName,
      injectionType,
      context
    );
    if (!alreadyExists) {
      console.log(chalk.dim(`Component generation successful: ${absoluteComponentPath}`));
      const configFilePath = path.resolve(process.cwd(), 'index.ts');
      console.log(chalk.dim(`Injecting component: ${configFilePath}, ${componentFileName}`));
      await injectLoginComponent(configFilePath, `@@/${componentFileName}`);
      
      console.log(
        chalk.bold.greenBright('You can now open the component in your IDE:'),
        chalk.underline.cyanBright(absoluteComponentPath)
      );
    }
    process.exit(0);
  }catch (error) {
    console.error(error);
    console.error(chalk.red('\n❌ Component creation failed. Please check the errors above.'));
    process.exit(1);
  }
  
}

async function handleGlobalInjectionCreation(config) {
  console.log('Selected ❯ 🌍 Global page injections');

  const injectionType = await select({
    message: 'Select global injection type:',
    choices: [
      { name: 'User Menu', value: 'userMenu' },
      { name: 'Header', value: 'header' },
      { name: 'Sidebar', value: 'sidebar' },
      { name: 'Every Page Bottom', value: 'everyPageBottom' },
      { name: '🔙 BACK', value: '__BACK__' },
    ],
  });

  if (injectionType === '__BACK__') return createComponent([]);

  console.log(chalk.grey(`Selected ❯ 🌍 Global page injections ❯ ${injectionType}`));

  const reason = await input({
    message: 'What will you need the component for? (enter name)',
  });

  console.log(chalk.grey(`Selected ❯ 🌍 Global page injections ❯ ${injectionType} ❯ ${reason}`));

  try {
    const safeName = sanitizeLabel(reason)
    const componentFileName = `CustomGlobal${safeName}.vue`;

    const context = { reason };

    const { alreadyExists, path: absoluteComponentPath } = await generateLoginOrGlobalComponentFile(
      componentFileName,
      injectionType,
      context
    );
    if (!alreadyExists) {
      console.log(chalk.dim(`Component generation successful: ${absoluteComponentPath}`));

      const configFilePath = path.resolve(process.cwd(), 'index.ts');
      
      await injectGlobalComponent(configFilePath, injectionType, `@@/${componentFileName}`);

      console.log(
        chalk.bold.greenBright('You can now open the component in your IDE:'),
        chalk.underline.cyanBright(absoluteComponentPath)
      );
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    console.error(chalk.red('\n❌ Component creation failed. Please check the errors above.'));
    process.exit(1);
  }
}
