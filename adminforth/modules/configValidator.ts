import { 
  AdminForthConfig, 
  AdminForthResource, 
  IAdminForth, IConfigValidator, 
  type AfterSaveFunction,
  AdminForthBulkAction,
} from "../types/Back.js";

import fs from 'fs';
import path from 'path';
import { guessLabelFromName, md5hash, suggestIfTypo } from './utils.js';
import { 
  AdminForthSortDirections,
  type AdminForthComponentDeclarationFull,
  AllowedActionsEnum,
  AdminForthComponentDeclaration , 
  AdminForthResourcePages, 
} from "../types/Common.js";



export default class ConfigValidator implements IConfigValidator {

  constructor(private adminforth: IAdminForth, private config: AdminForthConfig) {
    this.adminforth = adminforth;
    this.config = config;
  }
  
  validateAndListifyInjection(obj, key, errors) {
    if (!Array.isArray(obj[key])) {
      // not array
      obj[key] = [obj[key]];
    }
    obj[key].forEach((target, i) => {
      obj[key][i] = this.validateComponent(target, errors);
    });
  }

  checkCustomFileExists(filePath: string): Array<string> {
    if (filePath.startsWith('@@/')) {
      const checkPath = path.join(this.config.customization.customComponentsDir, filePath.replace('@@/', ''));
      if (!fs.existsSync(checkPath)) {
        return [`File file ${filePath} does not exist in ${this.config.customization.customComponentsDir}`];
      }
    }
    return [];
  }

  validateComponent(component: AdminForthComponentDeclaration, errors: Array<string>): AdminForthComponentDeclaration {
    
    if (!component) {
      return component;
    }
    let obj: AdminForthComponentDeclarationFull;
    if (typeof component === 'string') {
      obj = { file: component, meta: {} };
    } else {
      obj = component;
    }

    let ignoreExistsCheck = false;
    if (
      this.adminforth.codeInjector.allComponentNames.hasOwnProperty(
        (component as AdminForthComponentDeclarationFull).file)
    ) {
      // not obvious, but if we are in this if, it means that this is plugin component
      // if component is plugin component, we don't need to check if it exists in users folder
      ignoreExistsCheck = true;
    }
    

    if (!ignoreExistsCheck) {
      errors.push(...this.checkCustomFileExists(obj.file));
    }
    
    return obj;
  }

  validateConfig() {
    const errors = [];

    if (!this.config.customization.customComponentsDir) {
      this.config.customization.customComponentsDir = './custom';
    }

    try {
      // check customComponentsDir exists
      fs.accessSync(this.config.customization.customComponentsDir, fs.constants.R_OK);
    } catch (e) {
      this.config.customization.customComponentsDir = undefined;
    }

    if (!this.config.customization) {
      this.config.customization = {};
    }

    if (!this.config.customization.customComponentsDir) {
      this.config.customization.customComponentsDir = './custom';
    }

    try {
      // check customComponentsDir exists
      fs.accessSync(this.config.customization.customComponentsDir, fs.constants.R_OK);
    } catch (e) {
      this.config.customization.customComponentsDir = undefined;
    }

    if (this.config.customization.customPages) {
      this.config.customization.customPages.forEach((page, i) => {
        this.validateComponent(page.component, errors);
      });
    } else {
      this.config.customization.customPages = [];
    }
    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }
    if (!this.config.baseUrl.endsWith('/')) {
      this.adminforth.baseUrlSlashed = this.config.baseUrl + '/';
    } else {
      this.adminforth.baseUrlSlashed = this.config.baseUrl;
    }
    if (this.config.customization.brandName === undefined) {
      this.config.customization.brandName = 'AdminForth';
    }

    // slug should have only lowercase letters, dashes and numbers
    this.config.customization._brandNameSlug = this.config.customization.brandName.toLowerCase().replace(/[^a-z0-9-]/g, '');
   
    if (this.config.customization.loginPageInjections === undefined) {
      this.config.customization.loginPageInjections = {};
    }
    if (this.config.customization.globalInjections === undefined) {
      this.config.customization.globalInjections = {};
    }
    if (this.config.customization.loginPageInjections.underInputs === undefined) {
      this.config.customization.loginPageInjections.underInputs = [];
    }
    if (this.config.customization.brandLogo) {
      errors.push(...this.checkCustomFileExists(this.config.customization.brandLogo));
    }
    if (this.config.customization.showBrandNameInSidebar === undefined) {
      this.config.customization.showBrandNameInSidebar = true;
    }
    if (this.config.customization.favicon) {
      errors.push(...this.checkCustomFileExists(this.config.customization.favicon));
    }

    if (!this.config.customization.datesFormat) {
      this.config.customization.datesFormat = 'MMM D, YYYY';
    }

    if (!this.config.customization.timeFormat) {
      this.config.customization.timeFormat = 'HH:mm:ss';
    }

    if (this.config.resources) {
      this.config.resources.forEach((res: AdminForthResource) => {
        if (!res.table) {
          errors.push(`Resource "${res.dataSource}" is missing table`);
        }
        // if recordLabel is not callable, throw error
        if (res.recordLabel && typeof res.recordLabel !== 'function') {
          errors.push(`Resource "${res.dataSource}" recordLabel is not a function`);
        }
        if (!res.recordLabel) {
          res.recordLabel = (item) => {
            const pkVal = item[res.columns.find((col) => col.primaryKey).name];
            return `${res.label} ${pkVal}`;
          }
        }


        res.resourceId = res.resourceId || res.table;
        // as fallback value, capitalize and then replace _ with space
        res.label = res.label || res.resourceId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        if (!res.dataSource) {
          errors.push(`Resource "${res.resourceId}" is missing dataSource`);
        }
        if (!res.columns) {
          res.columns = [];
        }
        res.columns.forEach((col) => {
          col.label = col.label || guessLabelFromName(col.name);
          //define default sortable
          if (!Object.keys(col).includes('sortable')) { col.sortable = true; }
          if (col.showIn && !Array.isArray(col.showIn)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" showIn must be an array`);
          }

          // check col.required is string or object
          if (col.required && !((typeof col.required === 'boolean') || (typeof col.required === 'object'))) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" required must be a string or object`);
          }

          // if it is object check the keys are one of ['create', 'edit']
          if (typeof col.required === 'object') {
            const wrongRequiredOn = Object.keys(col.required).find((c) => !['create', 'edit'].includes(c));
            if (wrongRequiredOn) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid required value "${wrongRequiredOn}", allowed keys are 'create', 'edit']`);
            }
          }

          // same for editingNote
          if (col.editingNote && !((typeof col.editingNote === 'string') || (typeof col.editingNote === 'object'))) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" editingNote must be a string or object`);
          }
          if (typeof col.editingNote === 'object') {
            const wrongEditingNoteOn = Object.keys(col.editingNote).find((c) => !['create', 'edit'].includes(c));
            if (wrongEditingNoteOn) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid editingNote value "${wrongEditingNoteOn}", allowed keys are 'create', 'edit']`);
            }
          }

          const wrongShowIn = col.showIn && col.showIn.find((c) => AdminForthResourcePages[c] === undefined);
          if (wrongShowIn) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid showIn value "${wrongShowIn}", allowed values are ${Object.keys(AdminForthResourcePages).join(', ')}`);
          }
          col.showIn = col.showIn || Object.values(AdminForthResourcePages);

          if (col.foreignResource) {

            if (!col.foreignResource.resourceId) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource without resourceId`);
            }
            const resource = this.config.resources.find((r) => r.resourceId === col.foreignResource.resourceId);
            if (!resource) {
              const similar = suggestIfTypo(this.config.resources.map((r) => r.resourceId), col.foreignResource.resourceId);
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource resourceId which is not in resources: "${col.foreignResource.resourceId}". 
              ${similar ? `Did you mean "${similar}" instead of "${col.foreignResource.resourceId}"?` : ''}`);
            }
            const befHook = col.foreignResource.hooks?.dropdownList?.beforeDatasourceRequest;
            if (befHook) {
              if (!Array.isArray(befHook)) {
                col.foreignResource.hooks.dropdownList.beforeDatasourceRequest = [befHook];
              }
            }
            const aftHook = col.foreignResource.hooks?.dropdownList?.afterDatasourceResponse;
            if (aftHook) {
              if (!Array.isArray(aftHook)) {
                col.foreignResource.hooks.dropdownList.afterDatasourceResponse = [aftHook];
              }
            }
          }
        })

        if (!res.options) {
          res.options = { bulkActions: [], allowedActions: {} };
        }

        if (!res.options.allowedActions) {
          res.options.allowedActions = {
            all: true,
          };
        }

        if (res.options.defaultSort) {
          const colName = res.options.defaultSort.columnName;
          const col = res.columns.find((c) => c.name === colName);
          if (!col) {
            const similar = suggestIfTypo(res.columns.map((c) => c.name), colName);
            errors.push(`Resource "${res.resourceId}" defaultSort.columnName column "${colName}" not found in columns. ${similar ? `Did you mean "${similar}"?` : ''}`);
          }
          const dir = res.options.defaultSort.direction;
          if (!dir) {
            errors.push(`Resource "${res.resourceId}" defaultSort.direction is missing`);
          }
          // AdminForthSortDirections is enum
          if (!(Object.values(AdminForthSortDirections) as string[]).includes(dir)) {
            errors.push(`Resource "${res.resourceId}" defaultSort.direction "${dir}" is invalid, allowed values are ${Object.values(AdminForthSortDirections).join(', ')}`);
          }
        }

        if (Object.keys(res.options.allowedActions).includes('all')) {
          if (Object.keys(res.options.allowedActions).length > 1) {
            errors.push(`Resource "${res.resourceId}" allowedActions cannot have "all" and other keys at same time: ${Object.keys(res.options.allowedActions).join(', ')}`);
          }
          for (const key of Object.keys(AllowedActionsEnum)) {
            if (key !== 'all') {
              res.options.allowedActions[key] = res.options.allowedActions.all;
            }
          }
          delete res.options.allowedActions.all;
        } else {
          // by default allow all actions
          for (const key of Object.keys(AllowedActionsEnum)) {
            if (!Object.keys(res.options.allowedActions).includes(key)) {
              res.options.allowedActions[key] = true;
            }
          }
        }


        //check if resource has bulkActions
        let bulkActions: AdminForthBulkAction[] = res?.options?.bulkActions || [];

        if (!Array.isArray(bulkActions)) {
          errors.push(`Resource "${res.resourceId}" bulkActions must be an array`);
          bulkActions = [];
        }

        if (!bulkActions.find((action) => action.label === 'Delete checked')) {
          bulkActions.push({
            label: `Delete checked`,
            state: 'danger',
            icon: 'flowbite:trash-bin-outline',
            confirm: 'Are you sure you want to delete selected items?',
            allowed: async ({ resource, adminUser, allowedActions }) => { return allowedActions.delete },
            action: async ({ selectedIds, adminUser }) => {
              const connector = this.adminforth.connectors[res.dataSource];

              // for now if at least one error, stop and return error
              let error = null;

              await Promise.all(
                selectedIds.map(async (recordId) => {
                  const record = await connector.getRecordByPrimaryKey(res, recordId);

                  await Promise.all(
                    (res.hooks.delete.beforeSave as AfterSaveFunction[]).map(
                      async (hook) => {
                        const resp = await hook({ 
                          recordId: recordId,
                          resource: res, 
                          record, 
                          adminUser,
                          adminforth: this.adminforth
                        }); 
                        if (!error && resp.error) {
                          error = resp.error;
                        }
                      }
                    )
                  )

                  if (error) {
                    return;
                  }
                  
                  await connector.deleteRecord({ resource: res, recordId });
                  // call afterDelete hook
                  await Promise.all(
                    (res.hooks.delete.afterSave as AfterSaveFunction[]).map(
                      async (hook) => {
                        await hook({ 
                          resource: res, 
                          record, 
                          adminUser,
                          recordId: recordId,
                          adminforth: this.adminforth,
                        }); 
                      }
                    )
                  )
                  
                })
              );

              if (error) {
                return { error, ok: false };
              }
              return { ok: true, successMessage: `${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''} deleted` };
            }
          });
        }

        bulkActions.map((action) => {
          if (!action.id) {
            action.id = md5hash(action.label);
          }
        });
        res.options.bulkActions = bulkActions;

        // if pageInjection is a string, make array with one element. Also check file exists
        const possibleInjections = ['beforeBreadcrumbs', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems', 'customActionIcons'];
        const possiblePages = ['list', 'show', 'create', 'edit'];

        
          

        if (res.options.pageInjections) {

          Object.entries(res.options.pageInjections).map(([key, value]) => {
            if (!possiblePages.includes(key)) {
              const similar = suggestIfTypo(possiblePages, key);
              errors.push(`Resource "${res.resourceId}" has invalid pageInjection key "${key}", allowed keys are ${possiblePages.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
            }

            Object.entries(value).map(([injection, target]) => {
              if (possibleInjections.includes(injection)) {
                this.validateAndListifyInjection(res.options.pageInjections[key], injection, errors);
              } else {
                const similar = suggestIfTypo(possibleInjections, injection);
                errors.push(`Resource "${res.resourceId}" has invalid pageInjection key "${injection}", Supported keys are ${possibleInjections.join(', ')} ${similar ? `Did you mean "${similar}"?` : ''}`);
              }
            });

          })
          
        }

        // transform all hooks Functions to array of functions
        if (!res.hooks) {
          res.hooks = {};
        }
        for (const hookName of ['show', 'list']) {
          if (!res.hooks[hookName]) {
            res.hooks[hookName] = {};
          }
          if (!res.hooks[hookName].beforeDatasourceRequest) {
            res.hooks[hookName].beforeDatasourceRequest = [];
          }

          if (!Array.isArray(res.hooks[hookName].beforeDatasourceRequest)) {
            res.hooks[hookName].beforeDatasourceRequest = [res.hooks[hookName].beforeDatasourceRequest];
          }

          if (!res.hooks[hookName].afterDatasourceResponse) {
            res.hooks[hookName].afterDatasourceResponse = [];
          }

          if (!Array.isArray(res.hooks[hookName].afterDatasourceResponse)) {
            res.hooks[hookName].afterDatasourceResponse = [res.hooks[hookName].afterDatasourceResponse];
          }
        }
        for (const hookName of ['create', 'edit', 'delete']) {
          if (!res.hooks[hookName]) {
            res.hooks[hookName] = {};
          }
          if (!res.hooks[hookName].beforeSave) {
            res.hooks[hookName].beforeSave = [];
          }
          if (!Array.isArray(res.hooks[hookName].beforeSave)) {
            res.hooks[hookName].beforeSave = [res.hooks[hookName].beforeSave];
          }
          if (!res.hooks[hookName].afterSave) {
            res.hooks[hookName].afterSave = [];
          }
          if (!Array.isArray(res.hooks[hookName].afterSave)) {
            res.hooks[hookName].afterSave = [res.hooks[hookName].afterSave];
          }
        }
      });

      if (this.config.customization.globalInjections) {
        const ALLOWED_GLOBAL_INJECTIONS = ['userMenu', 'header', 'sidebar',]
        Object.keys(this.config.customization.globalInjections).forEach((injection) => {
          if (ALLOWED_GLOBAL_INJECTIONS.includes(injection)) {
            this.validateAndListifyInjection(this.config.customization.globalInjections, injection, errors);
          } else {
            const similar = suggestIfTypo(ALLOWED_GLOBAL_INJECTIONS, injection);
            errors.push(`Global injection key "${injection}" is not allowed. Allowed keys are ${ALLOWED_GLOBAL_INJECTIONS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
          }
        });
      }

      if (this.config.customization.loginPageInjections) {
        const ALLOWED_GLOBAL_INJECTIONS = ['underInputs']
        Object.keys(this.config.customization.loginPageInjections).forEach((injection) => {
          if (ALLOWED_GLOBAL_INJECTIONS.includes(injection)) {
            this.validateAndListifyInjection(this.config.customization.loginPageInjections, injection, errors);
          } else {
            const similar = suggestIfTypo(ALLOWED_GLOBAL_INJECTIONS, injection);
            errors.push(`Login page injection key "${injection}" is not allowed. Allowed keys are ${ALLOWED_GLOBAL_INJECTIONS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
          }
        });
      }

      if (!this.config.menu) {
        errors.push('No config.menu defined');
      }

      // check if there is only one homepage: true in menu, recursivly
      let homepages = 0;
      const browseMenu = (menu) => {
        menu.forEach((item) => {
          if (item.component && item.resourceId) {
            errors.push(`Menu item cannot have both component and resourceId: ${JSON.stringify(item)}`);
          }
          if (item.component && !item.path) {
            errors.push(`Menu item with component must have path : ${JSON.stringify(item)}`);
          }

          if (item.type === 'resource' && !item.resourceId) {
            errors.push(`Menu item with type 'resource' must have resourceId : ${JSON.stringify(item)}`);
          }

          if (item.resourceId && !this.config.resources.find((res) => res.resourceId === item.resourceId)) {
            const similar = suggestIfTypo(this.config.resources.map((res) => res.resourceId), item.resourceId);
            errors.push(`Menu item with type 'resourceId' has resourceId which is not in resources: "${JSON.stringify(item)}". 
                ${similar ? `Did you mean "${similar}" instead of "${item.resourceId}"?` : ''}`);
          }

          if (item.type === 'component' && !item.component) {
            errors.push(`Menu item with type 'component' must have component : ${JSON.stringify(item)}`);
          }

          // make sure component starts with @@
          if (item.component) {
            if (!item.component.startsWith('@@')) {
              errors.push(`Menu item component must start with @@ : ${JSON.stringify(item)}`);
            }

            const path = item.component.replace('@@', this.config.customization.customComponentsDir);
            if (!fs.existsSync(path)) {
              errors.push(`Menu item component "${item.component.replace('@@', '')}" does not exist in "${this.config.customization.customComponentsDir}"`);
            }
          }

          if (item.homepage) {
            homepages++;
            if (homepages > 1) {
              errors.push('There must be only one homepage: true in menu, found second one in ' + JSON.stringify(item));
            }
          }
          if (item.children) {
            browseMenu(item.children);
          }
        });
      };
      browseMenu(this.config.menu);

    }

    if (this.config.auth) {
      // TODO: remove in future releases
      if (!this.config.auth.usersResourceId && this.config.auth.resourceId) {
        this.config.auth.usersResourceId = this.config.auth.resourceId;
      }

      if (!this.config.auth.usersResourceId) {
        throw new Error('No config.auth.usersResourceId defined');
      }
      if (!this.config.auth.passwordHashField) {
        throw new Error('No config.auth.passwordHashField defined');
      }
      if (!this.config.auth.usernameField) {
        throw new Error('No config.auth.usernameField defined');
      }
      if (this.config.auth.loginBackgroundImage) {
        errors.push(...this.checkCustomFileExists(this.config.auth.loginBackgroundImage));
      }
      const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.usersResourceId);
      if (!userResource) {
        const similar = suggestIfTypo(this.config.resources.map((res) => res.resourceId ), this.config.auth.usersResourceId);
        throw new Error(`Resource with id "${this.config.auth.usersResourceId}" not found. ${similar ? `Did you mean "${similar}"?` : ''}`);
      }

      if (!this.config.auth.beforeLoginConfirmation) {
        this.config.auth.beforeLoginConfirmation = [];
      }
    }

    // check for duplicate resourceIds and show which ones are duplicated
    const resourceIds = this.config.resources.map((res) => res.resourceId);
    const uniqueResourceIds = new Set(resourceIds);
    if (uniqueResourceIds.size != resourceIds.length) {
      const duplicates = resourceIds.filter((item, index) => resourceIds.indexOf(item) != index);
      errors.push(`Duplicate fields "resourceId" or "table": ${duplicates.join(', ')}`);
    }

    //add ids for onSelectedAllActions for each resource
    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }

    // check is all custom components files exists
    for (const resource of this.config.resources) {
      for (const column of resource.columns) {
        if (column.components) {

          for (const [key, comp] of Object.entries(column.components as Record<string, AdminForthComponentDeclarationFull>)) {
            
            column.components[key] = this.validateComponent(comp, errors);
          }
        }
      }
    }
  }

  postProcessAfterDiscover(resource: AdminForthResource) {
    resource.columns.forEach((column) => {
      // if db/user says column is required in boolean, expand
      if (typeof column.required === 'boolean') {
        column.required = { create: column.required, edit: column.required };
      }

      if (!column.required) {
        column.required = { create: false, edit: false };
      }

      // same for editingNote
      if (typeof column.editingNote === 'string') {
        column.editingNote = { create: column.editingNote, edit: column.editingNote };
      }
    })
    resource.dataSourceColumns = resource.columns.filter((col) => !col.virtual);
    (resource.plugins || []).forEach((plugin) => {
      if (plugin.validateConfigAfterDiscover) {
        plugin.validateConfigAfterDiscover(this.adminforth, resource);
      }
    });
  }
}