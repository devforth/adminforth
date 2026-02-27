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
  ShowInLegacyInput,
  ShowInModernInput,
} from "../types/Back.js";

import fs from 'fs';
import path from 'path';
import { guessLabelFromName, md5hash, suggestIfTypo, slugifyString } from './utils.js';
import { 
  AdminForthSortDirections,
  type AdminForthComponentDeclarationFull,
  AllowedActionsEnum,
  AdminForthComponentDeclaration , 
  AdminForthResourcePages,
  AdminForthDataTypes,
  Predicate,
} from "../types/Common.js";
import AdminForth from "adminforth";
import { AdminForthConfigMenuItem } from "adminforth";
import { afLogger } from "./logger.js";


export default class ConfigValidator implements IConfigValidator {

  customComponentsDir: string | undefined;

  private static readonly LOGIN_INJECTION_KEYS = ['underInputs', 'underLoginButton', 'panelHeader'];
  private static readonly GLOBAL_INJECTION_KEYS = ['userMenu', 'header', 'sidebar', 'sidebarTop', 'everyPageBottom'];
  private static readonly PAGE_INJECTION_KEYS = ['beforeBreadcrumbs', 'beforeActionButtons', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems', 'customActionIcons', 'customActionIconsThreeDotsMenuItems'];

  constructor(private adminforth: IAdminForth, private inputConfig: AdminForthInputConfig) {
    this.adminforth = adminforth;
    this.inputConfig = inputConfig;
  }
  
  validateAndListifyInjection(obj, key, errors) {
    if (key.includes('tableRowReplace')) {
      if (obj[key].length > 1) {
        throw new Error(`tableRowReplace injection supports only one element, but received ${obj[key].length}.`);
      }
    }
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
      underLoginButton: [],
      panelHeader: [],
    };

    if (this.inputConfig.customization?.loginPageInjections) {
      Object.keys(this.inputConfig.customization.loginPageInjections).forEach((injection) => {
        if (ConfigValidator.LOGIN_INJECTION_KEYS.includes(injection)) {
          loginPageInjections[injection] = this.validateAndListifyInjectionNew(this.inputConfig.customization.loginPageInjections, injection, errors);
        } else {
          const similar = suggestIfTypo(ConfigValidator.LOGIN_INJECTION_KEYS, injection);
          errors.push(`Login page injection key "${injection}" is not allowed. Allowed keys are ${ConfigValidator.LOGIN_INJECTION_KEYS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
        }
      });
    }
    const globalInjections: AdminForthConfigCustomization['globalInjections'] = {
      userMenu: [],
      header: [],
      sidebar: [],
      sidebarTop: [],
      everyPageBottom: [],
    };

    if (this.inputConfig.customization?.globalInjections) {
      Object.keys(this.inputConfig.customization.globalInjections).forEach((injection) => {
        if (ConfigValidator.GLOBAL_INJECTION_KEYS.includes(injection)) {
          globalInjections[injection] = this.validateAndListifyInjectionNew(this.inputConfig.customization.globalInjections, injection, errors);
        } else {
          const similar = suggestIfTypo(ConfigValidator.GLOBAL_INJECTION_KEYS, injection);
          errors.push(`Global injection key "${injection}" is not allowed. Allowed keys are ${ConfigValidator.GLOBAL_INJECTION_KEYS.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
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
    customization.customPages.forEach((page) => {
      page.component = this.validateComponent(page.component, errors);
      const meta = page.component.meta || {};
      if (meta.sidebarAndHeader === undefined) {
        meta.sidebarAndHeader = meta.customLayout === true ? 'none' : 'default';
      }
      delete meta.customLayout;
      page.component.meta = meta;
    });
    
    if (!customization.brandName) { //} === undefined) {
      customization.brandName = 'AdminForth';
    }

    // slug should have only lowercase letters, dashes and numbers
    customization.brandNameSlug = slugifyString(customization.brandName);

    if (customization.brandLogo) {
      errors.push(...this.checkCustomFileExists(customization.brandLogo));
    }
    if (customization.iconOnlySidebar && customization.iconOnlySidebar.logo) {
      errors.push(...this.checkCustomFileExists(customization.iconOnlySidebar.logo)); 
    } 
    if (customization.showBrandNameInSidebar === undefined) {
      customization.showBrandNameInSidebar = true;
    }
    if (customization.showBrandLogoInSidebar === undefined) {
      customization.showBrandLogoInSidebar = true;
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
      icon: 'flowbite:trash-bin-outline',
      confirm: 'Are you sure you want to delete selected items?',
      allowed: async ({ resource, adminUser, allowedActions }) => { return allowedActions.delete },
      action: async ({ selectedIds, adminUser, response }) => {
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
                    response,
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
                    response,
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

    let showIn: ShowInInput = column.showIn || { all: true };

    if (column.showIn && Array.isArray(column.showIn)) {
      showIn = Object.values(AdminForthResourcePages).reduce((acc, key) => {
        return {
          ...acc,
          [key]: (column.showIn as ShowInLegacyInput).includes(key),
        }
      }, {} as ShowInInput);
      if (warnings.filter((w) => w.includes('showIn should be an object, array is deprecated')).length === 0) {
        warnings.push(`Resource "${resInput.resourceId || resInput.table}" column "${column.name}" showIn should be an object, array is deprecated`);
      }
    }

    const showInTransformedToObject: ShowInModernInput = showIn as ShowInModernInput; 

    // by default copy from 'all' key if present or show on all pages
    for (const key of Object.keys(AdminForthResourcePages)) {
      if (!Object.keys(showInTransformedToObject).includes(key)) {
        showInTransformedToObject[key] = showInTransformedToObject.all !== undefined ? showInTransformedToObject.all : true;
      }
    }
    if (showInTransformedToObject.all !== undefined) {
      delete showInTransformedToObject.all;
    }
    
    return showInTransformedToObject as ShowIn;
  }

  validateFieldGroups(fieldGroups: { groupName: string; columns: string[] }[], allColumnsList: string[]): string[] {
    if (!fieldGroups) return allColumnsList;

    const columnPositions = new Map<string, number>();
    let position = 0;

    fieldGroups.forEach((group) => {
      group.columns.forEach((col) => {
        if (!allColumnsList.includes(col)) {
          const similar = suggestIfTypo(allColumnsList, col);
          throw new Error(
            `Group '${group.groupName}' has an unknown column '${col}'. ${
              similar ? `Did you mean '${similar}'?` : ''
            }`
          );
        }
        if (!columnPositions.has(col)) {
          columnPositions.set(col, position++);
        }
      });
    });

    allColumnsList.forEach((col) => {
      if (!columnPositions.has(col)) {
        columnPositions.set(col, position++);
      }
    });
    return allColumnsList.sort((a, b) => {
      const posA = columnPositions.get(a);
      const posB = columnPositions.get(b);
      return posA - posB;
    });
  }

  validateAndNormalizeCustomActions(resInput: AdminForthResourceInput, res: Partial<AdminForthResource>, errors: string[]): any[] {
    if (!resInput.options?.actions) {
      return [];
    }

    const actions = [...resInput.options.actions];

    actions.forEach((action) => {
      if (!action.name) {
        errors.push(`Resource "${res.resourceId}" has action without name`);
      }

      if (!action.action && !action.url) {
        errors.push(`Resource "${res.resourceId}" action "${action.name}" must have action or url`);
      }
      
      if (action.action && action.url) {
        errors.push(`Resource "${res.resourceId}" action "${action.name}" cannot have both action and url`);
      }

      if (action.customComponent) {
        action.customComponent = this.validateComponent(action.customComponent as any, errors);
      }
  
      // Generate ID if not present
      if (!action.id) {
        action.id = md5hash(action.name);
      }
      if (!action.showIn) {
        action.showIn = {
          list: true,
          listThreeDotsMenu: false,
          showButton: false,
          showThreeDotsMenu: false,
        }
      } else {
        action.showIn.list = action.showIn.list ?? true;
        action.showIn.listThreeDotsMenu = action.showIn.listThreeDotsMenu ?? false;
        action.showIn.showButton = action.showIn.showButton ?? false;
        action.showIn.showThreeDotsMenu = action.showIn.showThreeDotsMenu ?? false;
      }
    });

    return actions;
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
        const col: Partial<AdminForthResourceColumn> = { 
          ...inCol, showIn: undefined, editingNote: undefined, required: undefined, 
        };

        col.required = typeof inCol.required === 'boolean' ? { create: inCol.required, edit: inCol.required } : inCol.required;

        // check for duplicate column names
        if (resInput.columns.findIndex((c) => c.name === col.name) !== inColIndex) {
          errors.push(`Resource "${res.resourceId}" has duplicate column name "${col.name}"`);
        }

        col.label = col.label || guessLabelFromName(col.name);
        //define default sortable
        if (!Object.keys(col).includes('sortable')) { col.sortable = !col.virtual; }

        // define default filter options
        if (!Object.keys(col).includes('filterOptions')) {
          col.filterOptions = {
            debounceTimeMs: 10,
            substringSearch: true,
          };
          if (col.enum || col.foreignResource || col.type === AdminForthDataTypes.BOOLEAN) {
            col.filterOptions.multiselect = true;
          }
        } else {
          if (col.filterOptions.debounceTimeMs !== undefined) {
            if (typeof col.filterOptions.debounceTimeMs !== 'number') {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" filterOptions.debounceTimeMs must be a number`);
            }
          } else {
            col.filterOptions.debounceTimeMs = 10;
          }

          if (col.filterOptions.substringSearch !== undefined) {
            if (typeof col.filterOptions.substringSearch !== 'boolean') {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" filterOptions.substringSearch must be a boolean`);
            }
          } else {
            col.filterOptions.substringSearch = true;
          }

          if (col.filterOptions.multiselect !== undefined) {
            if (typeof col.filterOptions.multiselect !== 'boolean') {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has multiselectFilter in filterOptions that is not boolean`);
            }

            if (!col.enum && !col.foreignResource && col.type !== AdminForthDataTypes.BOOLEAN) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" multiselectFilter in filterOptions should be set only for enum, foreign resource or boolean columns`);
            }
          } else if (col.enum || col.foreignResource) {
            col.filterOptions.multiselect = true;
          }
        }

        col.showIn = this.validateAndNormalizeShowIn(resInput, inCol, errors, warnings);

        if (col.showIn.create && inCol.fillOnCreate !== undefined) {
          errors.push(`Resource "${res.resourceId}" column "${col.name}" is shown on create page but has fillOnCreate. FillOnCreate is not allowed for columns shown on create page. Please either set showIn.create to false or remove fillOnCreate`);
        }

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

 
        // same for editingNote
        if (inCol.editingNote && !((typeof inCol.editingNote === 'string') || (typeof inCol.editingNote === 'object'))) {
          errors.push(`Resource "${res.resourceId}" column "${col.name}" editingNote must be a string or object`);
        }
        if (typeof inCol.editingNote === 'object') {
          const wrongEditingNoteOn = Object.keys(inCol.editingNote).find((c) => !['create', 'edit'].includes(c));
          if (wrongEditingNoteOn) {
            errors.push(`Resource "${res.resourceId}" column "${inCol.name}" has invalid editingNote value "${wrongEditingNoteOn}", allowed keys are 'create', 'edit']`);
          }
        }
        
        col.editingNote = typeof inCol.editingNote === 'string' ? { create: inCol.editingNote, edit: inCol.editingNote } : inCol.editingNote;

        if (col.isArray !== undefined) {
          if (typeof col.isArray !== 'object') {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray must be an object`);
          } else if (col.isArray.enabled) {
            if (col.primaryKey) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray cannot be used for a primary key columns`);
            }
            if (col.masked) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray cannot be used for a masked column`);
            }
            if (col.foreignResource && col.foreignResource.polymorphicResources) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray cannot be used for a polymorphic foreignResource column`);
            }

            if (!col.type || col.type !== AdminForthDataTypes.JSON) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray can be used only with column type JSON`);
            }

            if (col.isArray.itemType === undefined) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray must have itemType`);
            }
            if (col.isArray.itemType === AdminForthDataTypes.JSON) {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray itemType cannot be JSON`);
            }
          }
        }

        // check suggestOnCreate types
        if (inCol.suggestOnCreate !== undefined && typeof inCol.suggestOnCreate !== 'function') {
          if (!col.showIn.create) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate is present, while column is hidden on create page`);
          }

          if (inCol.suggestOnCreate === '' || inCol.suggestOnCreate === null) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate must not be empty`);
          }

          if (!['string', 'number', 'boolean', 'object'].includes(typeof inCol.suggestOnCreate)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate must be a string, number, boolean or object`);
          }

          // if suggestOnCreate is string, column should be one of the types with text inputs
          if (typeof inCol.suggestOnCreate === 'string' && ![AdminForthDataTypes.STRING, AdminForthDataTypes.DATE, AdminForthDataTypes.DATETIME, AdminForthDataTypes.TIME, AdminForthDataTypes.TEXT, undefined].includes(inCol.type)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate value does not match type of a column`);
          }

          if (typeof inCol.suggestOnCreate === 'number' && ![AdminForthDataTypes.INTEGER, AdminForthDataTypes.FLOAT, AdminForthDataTypes.DECIMAL].includes(inCol.type)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate value does not match type of a column`);
          }

          if (typeof inCol.suggestOnCreate === 'boolean' && inCol.type !== AdminForthDataTypes.BOOLEAN) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate value does not match type of a column`);
          }

          if (inCol.enum && !inCol.enum.map((ei) => ei.value).includes(inCol.suggestOnCreate)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate value is not in enum`);
          }

          if (typeof inCol.suggestOnCreate === 'object' && inCol.type !== AdminForthDataTypes.JSON) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" suggestOnCreate value does not match type of a column`);
          }

          if (inCol.isArray?.enabled && !Array.isArray(inCol.suggestOnCreate)) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" isArray is enabled but suggestOnCreate is not an array`);
          }
        }
        if (col.foreignResource){
          if (col.foreignResource.onDelete){
            if (col.foreignResource.onDelete !== 'cascade' && col.foreignResource.onDelete !== 'setNull'){
              errors.push (`Wrong delete strategy you can use 'onDelete' or 'cascade'`);
            }
          }
        }
        if (col.foreignResource) {
          if (!col.foreignResource.resourceId) {
            // resourceId is absent or empty
            if (!col.foreignResource.polymorphicResources && !col.foreignResource.polymorphicOn) {
              // foreignResource is present but no specifying fields
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource without resourceId`);
            } else if (!col.foreignResource.polymorphicResources || !col.foreignResource.polymorphicOn) {
              // some polymorphic fields are present but not all
              if (!col.foreignResource.polymorphicResources) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphic foreign resource requires polymorphicResources field`);
              } else {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphic foreign resource requires polymorphicOn field`);
              }
            } else {
              // correct polymorphic structure
              if (!col.foreignResource.polymorphicResources.length) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicResources `);
              }
              // we do || here because 'resourceId' might yet not be assigned from 'table'
              col.foreignResource.polymorphicResources.forEach((polymorphicResource, polymorphicResourceIndex) => {
                if (polymorphicResource.resourceId === undefined) {
                  errors.push(`Resource "${res.resourceId}" column "${col.name}" has polymorphic foreign resource without resourceId`);
                } else if (!polymorphicResource.whenValue) {
                  errors.push(`Resource "${res.resourceId}" column "${col.name}" has polymorphic foreign resource without whenValue`);
                } else if (polymorphicResource.resourceId !== null) {
                  const resource = this.inputConfig.resources.find((r) => r.resourceId === polymorphicResource.resourceId || r.table === polymorphicResource.resourceId);
                  if (!resource) {
                    const similar = suggestIfTypo(this.inputConfig.resources.map((r) => r.resourceId || r.table), polymorphicResource.resourceId);
                    errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource polymorphicResource resourceId which is not in resources: "${polymorphicResource.resourceId}". 
                  ${similar ? `Did you mean "${similar}" instead of "${polymorphicResource.resourceId}"?` : ''}`);
                  }
                  if (col.foreignResource.polymorphicResources.findIndex((pr) => pr.resourceId === polymorphicResource.resourceId) !== polymorphicResourceIndex) {
                    errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicResource resourceId should be unique`);
                  }
                }

                if (col.foreignResource.polymorphicResources.findIndex((pr) => pr.whenValue === polymorphicResource.whenValue) !== polymorphicResourceIndex) {
                  errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicResource whenValue should be unique`);
                }
              });

              const polymorphicOnInCol = resInput.columns.find((c) => c.name === col.foreignResource.polymorphicOn);
              if (!polymorphicOnInCol) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicOn links to an unknown column`);
              } else if (polymorphicOnInCol.type && polymorphicOnInCol.type !== AdminForthDataTypes.STRING) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicOn links to an column that is not of type string`);
              } else {
                const polymorphicOnColShowIn = this.validateAndNormalizeShowIn(resInput, polymorphicOnInCol, errors, warnings);
                if (typeof polymorphicOnColShowIn.create !== 'function' && typeof polymorphicOnColShowIn.edit !== 'function') {
                  if (polymorphicOnColShowIn.create || polymorphicOnColShowIn.edit) {
                    errors.push(`Resource "${res.resourceId}" column "${col.name}" polymorphicOn column should not be changeable manually`);
                  }
                }
              }
            }
          } else if (col.foreignResource.polymorphicResources || col.foreignResource.polymorphicOn) {
            // both resourceId and polymorphic fields
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource cannot have resourceId and be polymorphic at the same time`);
          } else {
            // non empty resourceId and no polymorphic fields
            // we do || here because 'resourceId' might yet not be assigned from 'table'
            const resource = this.inputConfig.resources.find((r) => r.resourceId === col.foreignResource.resourceId || r.table === col.foreignResource.resourceId);
            if (!resource) {
              const similar = suggestIfTypo(this.inputConfig.resources.map((r) => r.resourceId || r.table), col.foreignResource.resourceId);
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource resourceId which is not in resources: "${col.foreignResource.resourceId}". 
            ${similar ? `Did you mean "${similar}" instead of "${col.foreignResource.resourceId}"?` : ''}`);
            }
          }

          if (col.foreignResource.searchableFields) {
            const searchableFields = Array.isArray(col.foreignResource.searchableFields) 
              ? col.foreignResource.searchableFields 
              : [col.foreignResource.searchableFields];

            searchableFields.forEach((fieldName) => {
              if (typeof fieldName !== 'string') {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" foreignResource.searchableFields must contain only strings`);
                return;
              }

              if (col.foreignResource.resourceId) {
                const targetResource = this.inputConfig.resources.find((r) => r.resourceId === col.foreignResource.resourceId || r.table === col.foreignResource.resourceId);
                if (targetResource) {
                  const targetColumn = targetResource.columns.find((targetCol) => targetCol.name === fieldName);
                  if (!targetColumn) {
                    const similar = suggestIfTypo(targetResource.columns.map((c) => c.name), fieldName);
                    errors.push(`Resource "${res.resourceId}" column "${col.name}" foreignResource.searchableFields contains field "${fieldName}" which does not exist in target resource "${targetResource.resourceId || targetResource.table}". ${similar ? `Did you mean "${similar}"?` : ''}`);
                  }
                }
              } else if (col.foreignResource.polymorphicResources) {
                let hasFieldInAnyResource = false;
                for (const pr of col.foreignResource.polymorphicResources) {
                  if (pr.resourceId) {
                    const targetResource = this.inputConfig.resources.find((r) => r.resourceId === pr.resourceId || r.table === pr.resourceId);
                    if (targetResource) {
                      const hasField = targetResource.columns.some((targetCol) => targetCol.name === fieldName);
                      if (hasField) {
                        hasFieldInAnyResource = true;
                      }
                    }
                  }
                }      
                if (!hasFieldInAnyResource) {
                  errors.push(`Resource "${res.resourceId}" column "${col.name}" foreignResource.searchableFields contains field "${fieldName}" which does not exist in any of the polymorphic target resources`);
                }
              }
            });
          }

          if (col.foreignResource.unsetLabel) {
            if (typeof col.foreignResource.unsetLabel !== 'string') {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has foreignResource unsetLabel which is not a string`);
            }
          } else {
            // set default unset label
            col.foreignResource.unsetLabel = 'Unset';
          }

          // Set default searchIsCaseSensitive
          if (col.foreignResource.searchIsCaseSensitive === undefined) {
            col.foreignResource.searchIsCaseSensitive = false;
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

        if (inCol.inputPrefix || inCol.inputSuffix) {
          if (![AdminForthDataTypes.DECIMAL, AdminForthDataTypes.FLOAT, AdminForthDataTypes.INTEGER, AdminForthDataTypes.STRING, undefined].includes(col.type)) {
            if (inCol.type === AdminForthDataTypes.JSON) {
              if (inCol.isArray && inCol.isArray.enabled && ![AdminForthDataTypes.DECIMAL, AdminForthDataTypes.FLOAT, AdminForthDataTypes.INTEGER, AdminForthDataTypes.STRING].includes(inCol.isArray.itemType)) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" has input${inCol.inputPrefix ? 'Prefix': 'Suffix'} but it is not supported for array columns item type: ${inCol.isArray.itemType}`);
              } else if (!inCol.isArray || !inCol.isArray.enabled) {
                errors.push(`Resource "${res.resourceId}" column "${col.name}" has input${inCol.inputPrefix ? 'Prefix' : 'Suffix'} but it is not supported for this column type: ${col.type}`);
              }
            } else {
              errors.push(`Resource "${res.resourceId}" column "${col.name}" has input${inCol.inputPrefix ? 'Prefix' : 'Suffix'} but it is not supported for this column type: ${col.type}`);
            }
          }
          if (inCol.enum) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has input${inCol.inputPrefix ? 'Prefix' : 'Suffix'} but it is not supported for enum columns`);
          }
          if (inCol.foreignResource) {
            errors.push(`Resource "${res.resourceId}" column "${col.name}" has input${inCol.inputPrefix ? 'Prefix' : 'Suffix'} but it is not supported for foreignResource columns`);
          }
        }

        // check is all custom components files exists
        if (col.components) {
          for (const [key, comp] of Object.entries(col.components as Record<string, AdminForthComponentDeclarationFull>)) {
            col.components[key] = this.validateComponent(comp, errors);
          }
        }
        
        // fixes issues after discover when result of this validation applied to discovered column
        Object.keys(col).forEach((key) => {
          if (col[key] === undefined) {
            delete col[key];
          }
        });

        return col as AdminForthResourceColumn;
      })

      // Check for multiple sticky columns
      if (res.columns.filter(c => c.listSticky).length > 1) {
        errors.push(`Resource "${res.resourceId}" has more than one listSticky column. Only one column can be sticky in the list view.`);
      }

      const conditionalColumns = res.columns.filter(c => c.showIf);
      if (conditionalColumns.length) {
        const checkConditionArrays = (predicate: Predicate, column: AdminForthResourceColumn) => {
          if ("$and" in predicate && !Array.isArray(predicate.$and)) {
        errors.push(`Resource "${res.resourceId}" column "${column.name}" has showIf with $and that is not an array`);
          } else if ("$and" in predicate && Array.isArray(predicate.$and)) {
        predicate.$and.forEach((item) => checkConditionArrays(item, column));
          }

          if ("$or" in predicate && !Array.isArray(predicate.$or)) {
        errors.push(`Resource "${res.resourceId}" column "${column.name}" has showIf with $or that is not an array`);
          } else if ("$or" in predicate && Array.isArray(predicate.$or)) {
        predicate.$or.forEach((item) => checkConditionArrays(item, column));
          }
      
          const fieldEntries = Object.entries(predicate).filter(([key]) => !key.startsWith('$'));
          if (fieldEntries.length > 0) {
        fieldEntries.forEach(([field, condition]) => {
          if (typeof condition !== 'object') {
            return;
          }
          const relatedColumn = res.columns.find((c) => c.name === field);
          if (!relatedColumn) {
            const similar = suggestIfTypo(res.columns.map((c) => c.name), field);
            errors.push(`Resource "${res.resourceId}" column "${column.name}" has showIf on unknown column "${field}". ${similar ? `Did you mean "${similar}"?` : ''}`);
            return;
          }
          if ("$in" in condition && !Array.isArray(condition.$in)) {
            errors.push(`Resource "${res.resourceId}" column "${column.name}" has showIf with $in that is not an array`);
          }
          if ("$nin" in condition && !Array.isArray(condition.$nin)) {
            errors.push(`Resource "${res.resourceId}" column "${column.name}" has showIf with $nin that is not an array`);
          }
          if ("$includes" in condition && !relatedColumn.isArray?.enabled) {
            errors.push(`Resource "${res.resourceId}" has showIf with $includes on non-array column "${relatedColumn.name}"`);
          }
          if ("$nincludes" in condition && !relatedColumn.isArray?.enabled) {
            errors.push(`Resource "${res.resourceId}" has showIf with $nincludes on non-array column "${relatedColumn.name}"`);
          }
        });
          }
        };
        
        conditionalColumns.forEach((column) => {
          checkConditionArrays(column.showIf, column);
        });
      }

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
      options.actions = this.validateAndNormalizeCustomActions(resInput, res, errors);

      const allColumnsList = res.columns.map((col) => col.name);
      const sortedColumns = this.validateFieldGroups(options.fieldGroups, allColumnsList);

      res.columns = res.columns.sort((a, b) => {
        return sortedColumns.indexOf(a.name) - sortedColumns.indexOf(b.name);
      });

      // if pageInjection is a string, make array with one element. Also check file exists
      // Validate page-specific allowed injection keys
      const possiblePages = ['list', 'show', 'create', 'edit'];
      const allowedInjectionsByPage: Record<string, string[]> = {
        list: ['beforeBreadcrumbs', 'afterBreadcrumbs', 'beforeActionButtons', 'bottom', 'threeDotsDropdownItems', 'customActionIcons', 'customActionIconsThreeDotsMenuItems', 'tableBodyStart', 'tableRowReplace'],
        show: ['beforeBreadcrumbs', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems'],
        edit: ['beforeBreadcrumbs', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems'],
        create: ['beforeBreadcrumbs', 'afterBreadcrumbs', 'bottom', 'threeDotsDropdownItems'],
      };

      if (options.pageInjections) {

        Object.entries(options.pageInjections).map(([pageKey, value]) => {
          if (!possiblePages.includes(pageKey)) {
            const similar = suggestIfTypo(possiblePages, pageKey);
            errors.push(`Resource "${res.resourceId}" has invalid pageInjection page "${pageKey}", allowed pages are ${possiblePages.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
            return;
          }

          const allowedForThisPage = allowedInjectionsByPage[pageKey];

          Object.entries(value).map(([injection, _target]) => {
            if (allowedForThisPage.includes(injection)) {
              this.validateAndListifyInjection(options.pageInjections[pageKey], injection, errors);
            } else {
              const similar = suggestIfTypo(allowedForThisPage, injection);
              errors.push(`Resource "${res.resourceId}" has invalid pageInjection key "${injection}" for page "${pageKey}", supported keys are ${allowedForThisPage.join(', ')}. ${similar ? `Did you mean "${similar}"?` : ''}`);
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

  validateAfterPluginsActivation() {
    // Sort all page injections throughout the config by afOrder
    this.sortAllPageInjections();
  }

  private sortAllPageInjections(): void {
    const config = this.adminforth.config;
    
    // Sort login page injections
    if (config.customization?.loginPageInjections) {
      const loginInjections = config.customization.loginPageInjections;
      ConfigValidator.LOGIN_INJECTION_KEYS.forEach(key => {
        if (loginInjections[key]) {
          this.sortInjectionArray(loginInjections[key]);
        }
      });
    }

    // Sort global injections
    if (config.customization?.globalInjections) {
      const globalInjections = config.customization.globalInjections;
      ConfigValidator.GLOBAL_INJECTION_KEYS.forEach(key => {
        if (globalInjections[key]) {
          this.sortInjectionArray(globalInjections[key]);
        }
      });
    }

    // Sort resource page injections
    if (config.resources) {
      config.resources.forEach(resource => {
        if (resource.options?.pageInjections) {
          const pageInjections = resource.options.pageInjections;
          
          // For each page type (list, show, create, edit)
          Object.keys(pageInjections).forEach(pageType => {
            const pageTypeInjections = pageInjections[pageType];
            if (pageTypeInjections) {
              // For each injection point within the page
              ConfigValidator.PAGE_INJECTION_KEYS.forEach(injectionKey => {
                if (pageTypeInjections[injectionKey]) {
                  this.sortInjectionArray(pageTypeInjections[injectionKey]);
                }
              });
            }
          });
        }
      });
    }
  }

  private sortInjectionArray(injections: any): void {
    if (Array.isArray(injections)) {
      injections.sort((a: AdminForthComponentDeclarationFull, b: AdminForthComponentDeclarationFull) => 
        (b.meta?.afOrder ?? 0) - (a.meta?.afOrder ?? 0)
      );
    }
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

    try {
      new URL(newConfig.baseUrl);
      errors.push(`⛔️ This url is absolute path: ${newConfig.baseUrl}, you have to use relative paths`);
    } catch {

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
      if (newConfig.auth.userMenuSettingsPages) {
        for (const page of newConfig.auth.userMenuSettingsPages) {
          this.validateComponent({file: page.component}, errors);
          page.slug = page.slug ?? slugifyString(page.pageLabel);
        }
      }

      if (newConfig.auth.rememberMeDays !== undefined) {
        const rememberMeDays = newConfig.auth.rememberMeDays;
        if (typeof rememberMeDays !== 'number' || rememberMeDays <= 0) {
          errors.push(`auth.rememberMeDays must be a positive number`);
        } else {
          if (!newConfig.auth.rememberMeDuration) {
            newConfig.auth.rememberMeDuration = `${rememberMeDays}d`;
            warnings.push(`⚠️  auth.rememberMeDays is deprecated. Please use auth.rememberMeDuration: "${rememberMeDays}d" instead. Auto-converted for now.`);
          } else {
            warnings.push(`⚠️  Both auth.rememberMeDays and auth.rememberMeDuration are set. Using rememberMeDuration. Please remove rememberMeDays.`);
          }
        }
        delete newConfig.auth.rememberMeDays;
      }

      if (newConfig.auth.rememberMeDuration !== undefined) {
        const duration = newConfig.auth.rememberMeDuration;
        if (typeof duration !== 'string') {
          errors.push(`auth.rememberMeDuration must be a string in format "1s", "1m", "1h", or "1d"`);
        } else {
          const match = duration.match(/^(\d+)([smhd])$/);
          if (!match) {
            errors.push(`auth.rememberMeDuration must be in format "1s", "1m", "1h", or "1d" (e.g., "30d" for 30 days), got: "${duration}"`);
          }
        }
      }

      // normalize beforeLoginConfirmation hooks
      const blc = this.inputConfig.auth.beforeLoginConfirmation;
      if (!Array.isArray(blc)) {
        if (blc) {
          newConfig.auth.beforeLoginConfirmation = [blc];
        } else {
          newConfig.auth.beforeLoginConfirmation = [];
        }
      } else {
        newConfig.auth.beforeLoginConfirmation = blc;
      }

      // normalize adminUserAuthorize hooks
      const aua = this.inputConfig.auth.adminUserAuthorize;
      if (!Array.isArray(aua)) {
        if (aua) {
          newConfig.auth.adminUserAuthorize = [aua];
        } else {
          newConfig.auth.adminUserAuthorize = [];
        }
      } else {
        newConfig.auth.adminUserAuthorize = aua;
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
      afLogger.warn(`AdminForth config warnings: ${warnings.join(', ')}`);
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