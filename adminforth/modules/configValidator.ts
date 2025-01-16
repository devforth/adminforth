import { 
  AdminForthConfig, 
  AdminForthResource, 
  IAdminForth, IConfigValidator, 
  AdminForthBulkAction,
  AdminForthInputConfig,
  AdminForthConfigCustomization,
  AdminForthResourceInput,
  AdminForthResourceColumnInput,
  AdminForthResourceColumn,
  AllowedActions,
  ShowIn,
  ShowInInput,
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
import AdminForth from "adminforth";
import { AdminForthConfigMenuItem } from "adminforth";



export default class ConfigValidator implements IConfigValidator {

  customComponentsDir: string | undefined;

  constructor(private adminforth: IAdminForth, private inputConfig: AdminForthInputConfig) {
    this.adminforth = adminforth;
    this.inputConfig = inputConfig;
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

  validateAndListifyInjectionNew(obj: Record<string, any>, key: string, errors: Array<string>): Array<AdminForthComponentDeclarationFull> {
    let injections: AdminForthComponentDeclarationFull[] = obj[key];
    if (!Array.isArray(injections)) {
      // not array
      injections = [injections];
    }
    injections.forEach((target, i) => {
      injections[i] = this.validateComponent(target, errors);
    });
    return injections;
  }

  checkCustomFileExists(filePath: string): Array<string> {
    if (filePath.startsWith('@@/')) {
      const checkPath = path.join(this.customComponentsDir, filePath.replace('@@/', ''));
      if (!fs.existsSync(checkPath)) {
        return [`File file ${filePath} does not exist in ${this.customComponentsDir}`];
      }
    }
    return [];
  }

  validateComponent(component: AdminForthComponentDeclaration, errors: Array<string>): AdminForthComponentDeclarationFull {
    if (!component) {
      throw new Error('Component is missing during validation');
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

  validateAndNormalizeCustomization(errors: string[]): AdminForthConfigCustomization {
    this.customComponentsDir = this.inputConfig.customization?.customComponentsDir;
    if (!this.customComponentsDir) {
      this.customComponentsDir = './custom';
    }
    try {
      // check customComponentsDir exists
      fs.accessSync(this.customComponentsDir, fs.constants.R_OK);
    } catch (e) {
      this.customComponentsDir = undefined;
    }

    const loginPageInjections: AdminForthConfigCustomization['loginPageInjections'] = {
      underInputs: [],
    };

    if (this.inputConfig.customization?.loginPageInjections) {
      const ALLOWED_LOGIN_INJECTIONS = ['underInputs']
      Object.keys(this.inputConfig.customization.loginPageInjections).forEach((injection) => {
        if (ALLOWED_LOGIN_INJECTIONS.includes(injection)) {
          loginPageInjections[injection] = this.validateAndListifyInjectionNew(this.inputConfig.customization.loginPageInjections, injection, errors);
        } else {
          const similar = suggestIfTypo(ALLOWED_LOGIN_INJECTIONS, injection);
          errors.push(`Login page injection key "${injection}" is not allowed. Allowed keys are ${ALLOWED_LOGIN_INJECTIONS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
        }
      });
    }
    
    const globalInjections: AdminForthConfigCustomization['globalInjections'] = {
      userMenu: [],
      header: [],
      sidebar: [],
    };

    if (this.inputConfig.customization?.globalInjections) {
      const ALLOWED_GLOBAL_INJECTIONS = ['userMenu', 'header', 'sidebar']
      Object.keys(this.inputConfig.customization.globalInjections).forEach((injection) => {
        if (ALLOWED_GLOBAL_INJECTIONS.includes(injection)) {
          globalInjections[injection] = this.validateAndListifyInjectionNew(this.inputConfig.customization.globalInjections, injection, errors);
        } else {
          const similar = suggestIfTypo(ALLOWED_GLOBAL_INJECTIONS, injection);
          errors.push(`Global injection key "${injection}" is not allowed. Allowed keys are ${ALLOWED_GLOBAL_INJECTIONS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
        }
      });
    }

    const customization: Partial<AdminForthConfigCustomization> =  {
      ...(this.inputConfig.customization || {}),
      customComponentsDir: this.customComponentsDir,
      loginPageInjections,
      globalInjections,
    };

    if (!customization.customPages) {
      customization.customPages = [];
    }
    customization.customPages.forEach((page, i) => {
      this.validateComponent(page.component, errors);
    });
    
    if (!customization.brandName) { //} === undefined) {
      customization.brandName = 'AdminForth';
    }

    // slug should have only lowercase letters, dashes and numbers
    customization.brandNameSlug = customization.brandName.toLowerCase().replace(/[^a-z0-9-]/g, '');

    
    if (customization.brandLogo) {
      errors.push(...this.checkCustomFileExists(customization.brandLogo));
    }
    if (customization.showBrandNameInSidebar === undefined) {
      customization.showBrandNameInSidebar = true;
    }
    if (customization.favicon) {
      errors.push(...this.checkCustomFileExists(customization.favicon));
    }

    if (!customization.datesFormat) {
      customization.datesFormat = 'MMM D, YYYY';
    }

    if (!customization.timeFormat) {
      customization.timeFormat = 'HH:mm:ss';
    }

    return customization as AdminForthConfigCustomization;
  }

  validateAndNormalizeAllowedActions(resInput: AdminForthResourceInput, errors: string[]): AllowedActions {
    const allowedActions = resInput.options?.allowedActions || { all: true };

    if (Object.keys(allowedActions).includes('all')) {
      if (Object.keys(allowedActions).length > 1) {
        errors.push(`Resource "${resInput.resourceId || resInput.table}" allowedActions cannot have "all" and other keys at same time: ${Object.keys(allowedActions).join(', ')}`);
      }
      for (const key of Object.keys(AllowedActionsEnum)) {
        if (key !== 'all') {
          allowedActions[key] = allowedActions.all;
        }
      }
      delete allowedActions.all;
    } else {
      // by default allow all actions
      for (const key of Object.keys(AllowedActionsEnum)) {
        if (!Object.keys(allowedActions).includes(key)) {
          allowedActions[key] = true;
        }
      }
    }
    return allowedActions as AllowedActions;
  }

  validateAndNormalizeBulkActions(resInput: AdminForthResourceInput, res: Partial<AdminForthResource>, errors: string[]): AdminForthBulkAction[] {
    //check if resource has bulkActions
    let bulkActions: AdminForthBulkAction[] = resInput?.options?.bulkActions || [];

    if (!Array.isArray(bulkActions)) {
      errors.push(`Resource "${res.resourceId}" bulkActions must be an array`);
      bulkActions = [];
    }

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
            const record = await connector.getRecordByPrimaryKey(res as AdminForthResource, recordId);

            await Promise.all(
              (res.hooks.delete.beforeSave).map(
                async (hook) => {
                  const resp = await hook({ 
                    recordId: recordId,
                    resource: res as AdminForthResource, 
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
            
            await connector.deleteRecord({ resource: res as AdminForthResource, recordId });
            // call afterDelete hook
            await Promise.all(
              (res.hooks.delete.afterSave).map(
                async (hook) => {
                  await hook({ 
                    resource: res as AdminForthResource, 
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

    bulkActions.map((action) => {
      if (!action.id) {
        action.id = md5hash(action.label);
      }
    });
    return bulkActions;
  }

  validateAndNormalizeShowIn(resInput: AdminForthResourceInput, column: AdminForthResourceColumnInput, errors: string[], warnings: string[]): ShowIn {
    if (column.showIn && !Array.isArray(column.showIn) && typeof column.showIn !== 'object') {
      errors.push(`Resource "${resInput.resourceId || resInput.table}" column "${column.name}" showIn must be an object`);
      return;
    }

    let showIn = column.showIn || { all: true };

    if (column.showIn && Array.isArray(column.showIn)) {
      showIn = Object.values(AdminForthResourcePages).reduce((acc, key) => {
        return {
          ...acc,
          [key]: column.showIn.includes(key),
        }
      }, {} as ShowInInput);
      if (warnings.filter((w) => w.includes('showIn should be an object, array is deprecated')).length === 0) {
        warnings.push(`Resource "${resInput.resourceId || resInput.table}" column "${column.name}" showIn should be an object, array is deprecated`);
      }
    }

    // by default copy from 'all' key if present or show on all pages
    for (const key of Object.keys(AdminForthResourcePages)) {
      if (!Object.keys(showIn).includes(key)) {
        showIn[key] = showIn.all !== undefined ? showIn.all : true;
      }
    }
    if (showIn.all !== undefined) {
      delete showIn.all;
    }
    
    return showIn as ShowIn;
  }

  validateAndNormalizeResources(errors: string[], warnings: string[]): AdminForthResource[] {
    if (!this.inputConfig.resources) {
      errors.push('No resources defined, at least one resource must be defined');
      return [];
    }
    return this.inputConfig.resources.map((resInput: AdminForthResourceInput) => {
      const res: Partial<AdminForthResource> = { ...resInput, columns: undefined, options: undefined, hooks: undefined,  };
      if (!res.table) {
        errors.push(`Resource in "${res.dataSource}" is missing table`);
      }

      res.resourceId = res.resourceId || res.table;

      // if recordLabel is not callable, throw error
      if (res.recordLabel && typeof res.recordLabel !== 'function') {
        errors.push(`Resource "${res.resourceId}" recordLabel is not a function`);
      }
      if (!res.recordLabel) {
        res.recordLabel = (item) => {
          const pkVal = item[res.columns.find((col) => col.primaryKey).name];
          return `${res.label} ${pkVal}`;
        }
      }

      // as fallback value, capitalize and then replace _ with space
      res.label = res.label || res.resourceId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      if (!res.dataSource) {
        errors.push(`Resource "${res.resourceId}" is missing dataSource`);
      }
      if (!res.columns) {
        res.columns = [];
      }
      res.columns = resInput.columns.map((inCol: AdminForthResourceColumnInput, inColIndex) => {
        const col: Partial<AdminForthResourceColumn> = { ...inCol, showIn: undefined, required: undefined, editingNote: undefined };

        // check for duplicate column names
        if (resInput.columns.findIndex((c) => c.name === col.name) !== inColIndex) {
          errors.push(`Resource "${res.resourceId}" has duplicate column name "${col.name}"`);
        }

        col.label = col.label || guessLabelFromName(col.name);
        //define default sortable
        if (!Object.keys(col).includes('sortable')) { col.sortable = !col.virtual; }

        col.showIn = this.validateAndNormalizeShowIn(resInput, inCol, errors, warnings);

        // check col.required is boolean or object
        if (inCol.required && !((typeof inCol.required === 'boolean') || (typeof inCol.required === 'object'))) {
          errors.push(`Resource "${res.resourceId}" column "${col.name}" required must be a boolean or object`);
        }

        // if it is object check the keys are one of ['create', 'edit']
        if (typeof inCol.required === 'object') {
          const wrongRequiredOn = Object.keys(inCol.required).find((c) => !['create', 'edit'].includes(c));
          if (wrongRequiredOn) {
            errors.push(`Resource "${res.resourceId}" column "${inCol.name}" has invalid required value "${wrongRequiredOn}", allowed keys are 'create', 'edit']`);
          }
        }

        // force required to be object
        col.required = typeof inCol.required === 'boolean' ? { create: inCol.required, edit: inCol.required } : inCol.required;

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

        if (col.foreignResource) {

          if (!col.foreignResource.resourceId) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource without resourceId`);
          }
          // we do || here because 'resourceId' might yet not be assigned from 'table'
          const resource = this.inputConfig.resources.find((r) => r.resourceId === col.foreignResource.resourceId || r.table === col.foreignResource.resourceId);
          if (!resource) {
            const similar = suggestIfTypo(this.inputConfig.resources.map((r) => r.resourceId || r.table), col.foreignResource.resourceId);
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

        // check is all custom components files exists
        if (col.components) {
          for (const [key, comp] of Object.entries(col.components as Record<string, AdminForthComponentDeclarationFull>)) {
            col.components[key] = this.validateComponent(comp, errors);
          }
        }
        return col as AdminForthResourceColumn;
      })

      const options: Partial<AdminForthResource['options']> = {...resInput.options, bulkActions: undefined, allowedActions: undefined};

      options.allowedActions = this.validateAndNormalizeAllowedActions(resInput, errors);

      if (options.defaultSort) {
        const colName = options.defaultSort.columnName;
        const col = res.columns.find((c) => c.name === colName);
        if (!col) {
          const similar = suggestIfTypo(res.columns.map((c) => c.name), colName);
          errors.push(`Resource "${res.resourceId}" defaultSort.columnName column "${colName}" not found in columns. ${similar ? `Did you mean "${similar}"?` : ''}`);
        }
        const dir = options.defaultSort.direction;
        if (!dir) {
          errors.push(`Resource "${res.resourceId}" defaultSort.direction is missing`);
        }
        // AdminForthSortDirections is enum
        if (!(Object.values(AdminForthSortDirections) as string[]).includes(dir)) {
          errors.push(`Resource "${res.resourceId}" defaultSort.direction "${dir}" is invalid, allowed values are ${Object.values(AdminForthSortDirections).join(', ')}`);
        }
      }

      options.bulkActions = this.validateAndNormalizeBulkActions(resInput, res, errors);

      // if pageInjection is a string, make array with one element. Also check file exists
      const possibleInjections = ['beforeBreadcrumbs', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems', 'customActionIcons'];
      const possiblePages = ['list', 'show', 'create', 'edit'];

      if (options.pageInjections) {

        Object.entries(options.pageInjections).map(([key, value]) => {
          if (!possiblePages.includes(key)) {
            const similar = suggestIfTypo(possiblePages, key);
            errors.push(`Resource "${res.resourceId}" has invalid pageInjection key "${key}", allowed keys are ${possiblePages.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
          }

          Object.entries(value).map(([injection, target]) => {
            if (possibleInjections.includes(injection)) {
              this.validateAndListifyInjection(options.pageInjections[key], injection, errors);
            } else {
              const similar = suggestIfTypo(possibleInjections, injection);
              errors.push(`Resource "${res.resourceId}" has invalid pageInjection key "${injection}", Supported keys are ${possibleInjections.join(', ')} ${similar ? `Did you mean "${similar}"?` : ''}`);
            }
          });

        })
      }

      res.options = options as AdminForthResource['options'];

      // transform all hooks Functions to array of functions
      res.hooks = {};
      for (const hookName of ['show', 'list']) {
        res.hooks[hookName] = {};
        res.hooks[hookName].beforeDatasourceRequest = [];

        const bdr = resInput.hooks?.[hookName]?.beforeDatasourceRequest;
        if (!Array.isArray(bdr)) {
          if (bdr) {
            res.hooks[hookName].beforeDatasourceRequest = [bdr];
          } else {
            res.hooks[hookName].beforeDatasourceRequest = [];
          }
        } else {
          res.hooks[hookName].beforeDatasourceRequest = bdr;
        }

        res.hooks[hookName].afterDatasourceResponse = [];

        const adr = resInput.hooks?.[hookName]?.afterDatasourceResponse;

        if (!Array.isArray(adr)) {
          if (adr) {
            res.hooks[hookName].afterDatasourceResponse = [adr];
          } else {
            res.hooks[hookName].afterDatasourceResponse = [];
          }
        } else {
          res.hooks[hookName].afterDatasourceResponse = adr;
        }
      }
      for (const hookName of ['create', 'edit', 'delete']) {
        res.hooks[hookName] = {};
        res.hooks[hookName].beforeSave = [];

        const bs = resInput.hooks?.[hookName]?.beforeSave;
        if (!Array.isArray(bs)) {
          if (bs) {
            res.hooks[hookName].beforeSave = [bs];
          } else {
            res.hooks[hookName].beforeSave = [];
          }
        } else {
          res.hooks[hookName].beforeSave = bs;
        }

        res.hooks[hookName].afterSave = [];

        const as = resInput.hooks?.[hookName]?.afterSave;
        if (!Array.isArray(as)) {
          if (as) {
            res.hooks[hookName].afterSave = [as];
          } else {
            res.hooks[hookName].afterSave = [];
          }
        } else {
          res.hooks[hookName].afterSave = as;
        }
      }

      return res as AdminForthResource;
    });
    
  }

  validateConfig() {
    const errors = [];
    const warnings = [];

    const newConfig: Partial<AdminForthConfig> = { 
      ...this.inputConfig,
      customization: this.validateAndNormalizeCustomization(errors),
      resources: this.validateAndNormalizeResources(errors, warnings),
    };

    if (!newConfig.baseUrl) {
      newConfig.baseUrl = '';
    }
    if (!newConfig.baseUrl.endsWith('/')) {
      newConfig.baseUrlSlashed = `${newConfig.baseUrl}/`;
    } else {
      newConfig.baseUrlSlashed = newConfig.baseUrl;
    }

    if (!newConfig.menu) {
      errors.push('No config.menu defined');
    }

    async function generateItemId(menuItem: AdminForthConfigMenuItem) {
      if (!menuItem.itemId) {
        const itemId = md5hash(`menu-item-${menuItem.label}-${menuItem.resourceId || ''}-${menuItem.path || ''}`);
        menuItem.itemId = itemId;
      }
    }

    // check if there is only one homepage: true in menu, recursivly
    let homepages: number = 0;
    const browseMenu = (menu: AdminForthConfigMenuItem[]) => {
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

        if (item.resourceId && !newConfig.resources.find((res) => res.resourceId === item.resourceId)) {
          const similar = suggestIfTypo(newConfig.resources.map((res) => res.resourceId), item.resourceId);
          errors.push(`Menu item with type 'resourceId' has resourceId which is not in resources: "${JSON.stringify(item)}". 
              ${similar ? `Did you mean "${similar}" instead of "${item.resourceId}"?` : ''}`);
        }

        if (item.type === 'page' && !item.component) {
          errors.push(`Menu item with type 'component' must have component : ${JSON.stringify(item)}`);
        }

        // make sure component starts with @@
        if (item.component) {
          if (!item.component.startsWith('@@')) {
            errors.push(`Menu item component must start with @@ : ${JSON.stringify(item)}`);
          }

          const path = item.component.replace('@@', newConfig.customization.customComponentsDir);
          if (!fs.existsSync(path)) {
            errors.push(`Menu item component "${item.component.replace('@@', '')}" does not exist in "${newConfig.customization.customComponentsDir}"`);
          }
        }

        generateItemId(item);

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
    browseMenu(newConfig.menu);

    // AUTH checks

    if (newConfig.auth) {
      if (!newConfig.auth.usersResourceId) {
        throw new Error('No config.auth.usersResourceId defined');
      }
      if (!newConfig.auth.passwordHashField) {
        throw new Error('No config.auth.passwordHashField defined');
      }
      if (!newConfig.auth.usernameField) {
        throw new Error('No config.auth.usernameField defined');
      }
      if (newConfig.auth.loginBackgroundImage) {
        errors.push(...this.checkCustomFileExists(newConfig.auth.loginBackgroundImage));
      }
      const userResource = newConfig.resources.find((res) => res.resourceId === newConfig.auth.usersResourceId);
      if (!userResource) {
        const similar = suggestIfTypo(newConfig.resources.map((res) => res.resourceId ), newConfig.auth.usersResourceId);
        throw new Error(`Resource with id "${newConfig.auth.usersResourceId}" not found. ${similar ? `Did you mean "${similar}"?` : ''}`);
      }

      if (!newConfig.auth.beforeLoginConfirmation) {
        newConfig.auth.beforeLoginConfirmation = [];
      }
    }

    // check for duplicate resourceIds and show which ones are duplicated
    const resourceIds = newConfig.resources.map((res) => res.resourceId);
    const uniqueResourceIds = new Set(resourceIds);
    if (uniqueResourceIds.size != resourceIds.length) {
      const duplicates = resourceIds.filter((item, index) => resourceIds.indexOf(item) != index);
      errors.push(`Duplicate fields "resourceId" or "table": ${duplicates.join(', ')}`);
    }

    if (warnings.length > 0) {
      console.warn(`AdminForth config warnings: ${warnings.join(', ')}`);
    }

    //add ids for onSelectedAllActions for each resource
    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }

    this.adminforth.config = newConfig as AdminForthConfig;
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