import { select, confirm, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import path from 'path'; // Import path
import { loadAdminForthConfig } from './configLoader.js'; // Helper to load config
import { generateComponentFile } from './fileGenerator.js'; // Helper to create the .vue file
import { updateResourceConfig } from './configUpdater.js'; // Helper to modify resource .ts file
// import { openFileInIde } from './ideHelper.js'; // Helper to open file

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

  const columnName = await select({
      message: 'Select column for which you want to create component:',
      choices: [
          ...selectedResource.columns.map(c => ({ name: `${c.label} ${chalk.grey(`${c.name}`)}`, value: c.name })),
          new Separator(),
          { name: '🔙 BACK', value: '__BACK__' },
      ]
  });
  if (columnName === '__BACK__') return handleFieldComponentCreation(config, resources); // Pass config back

  const selectedColumn = selectedResource.columns.find(c => c.name === columnName);
   console.log(chalk.grey(`Selected ❯ 🔤 Custom fields ❯ ${fieldType} ❯ ${selectedResource.label} ❯ ${selectedColumn.label}`));
   console.log(chalk.dim(`One-line alternative: |adminforth component fields.${fieldType}.${resourceId}.${columnName}|`));


  const existingComponentPath = null;

  if (existingComponentPath) {
    const action = await select({
        message: 'You already have a component for this field, open it in editor?',
        choices: [
            { name: '✏️ Open in IDE', value: 'open' },
            { name: '🔙 BACK', value: '__BACK__' },
            { name: '🚪 Exit', value: '__EXIT__' },
        ]
    });
    if (action === 'open') {
        // await openFileInIde(existingComponentPath); // Needs absolute path
        console.log(`Opening ${existingComponentPath}... (Implementation needed)`);
    } else if (action === '__BACK__') {
        return handleFieldComponentCreation(config, resources); // Pass config back
    } else {
        process.exit(0);
    }
  } else {
    const safeResourceLabel = selectedResource.label.replace(/[^a-zA-Z0-9]/g, '');
    const safeColumnLabel = selectedColumn.label.replace(/[^a-zA-Z0-9]/g, '');
    const componentFileName = `${safeResourceLabel}${safeColumnLabel}${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}.vue`; // e.g., UserEmailShow.vue
    const componentPathForConfig = `@@/${componentFileName}`; // Path relative to custom dir for config

    let absoluteComponentPath;
    try {
        absoluteComponentPath = await generateComponentFile(
            componentFileName,
            fieldType,
            { resource: selectedResource, column: selectedColumn },
            config
        );
        console.log(chalk.dim(`Component generation successful: ${absoluteComponentPath}`));

        await updateResourceConfig(selectedResource.resourceId, columnName, fieldType, componentPathForConfig);
        console.log(chalk.green(`\n✅ Successfully created component ${componentPathForConfig} and updated configuration.`));

        const openNow = await confirm({
            message: 'Open the new component file in your IDE?',
            default: true
        });
        if (openNow) {  // await openFileInIde(absoluteComponentPath); // Use the absolute path here
           console.log(`Opening ${absoluteComponentPath}... (Implementation needed)`);
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Component creation failed. Please check the errors above.'));
        process.exit(1);
    }
  }
}

// --- TODO: Implement similar handlers for other component types (pass config) ---
async function handleCrudPageInjectionCreation(config, resources) { console.log('CRUD Page Injection creation not implemented yet.'); }
async function handleLoginPageInjectionCreation(config) { console.log('Login Page Injection creation not implemented yet.'); }
async function handleGlobalInjectionCreation(config) { console.log('Global Injection creation not implemented yet.'); }
