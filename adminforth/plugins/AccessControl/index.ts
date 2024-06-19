import { 
  AdminForthResource, AdminForthClass, BeforeDataSourceRequestFunction,
  AllowedActionsEnum,
  BeforeSaveFunction
} from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import { PluginOptions } from "./types.js";



export default class AccessControlPlugin extends AdminForthPlugin {
 
  options: PluginOptions;
  adminforth: AdminForthClass;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  static defaultError = 'Sorry, you do not have access to this resource.'


  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;

    if (!resourceConfig.hooks) {
      resourceConfig.hooks = {};
    }

    const checkAccess = async (adminUser: any, action: AllowedActionsEnum, meta: any) => {
      const hasAccessOrError = await this.options.hasAccess(adminUser, action, meta);
      if (hasAccessOrError === true) {
        return { ok: true };
      } else {
        return { ok: false, error: hasAccessOrError || AccessControlPlugin.defaultError };
      }
    }

    const bindHookCheck = (action: AllowedActionsEnum, hookName: string) => {
      if (!resourceConfig.hooks[action]) {
        resourceConfig.hooks[action] = {};
      }
      if (!resourceConfig.hooks[action][hookName]) {
        resourceConfig.hooks[action][hookName] = [];
      }
      if (hookName === 'beforeDatasourceRequest') {
        (resourceConfig.hooks[action][hookName] as Array<BeforeDataSourceRequestFunction>).unshift(
          async ({adminUser, query}: {resource: AdminForthResource, adminUser: any, query: any}) => {
            return checkAccess(adminUser, action, { query });
          }
        );
      } else {
        (resourceConfig.hooks[action][hookName] as Array<BeforeSaveFunction>).unshift(
          async ({adminUser, record}: {resource: AdminForthResource, adminUser: any, record: any}) => {
            return checkAccess(adminUser, action, { record });
          }
        );
      }
    }

    // List check
    bindHookCheck(AllowedActionsEnum.list, 'beforeDatasourceRequest');

    // Show check
    bindHookCheck(AllowedActionsEnum.show, 'beforeDatasourceRequest');

    // Edit check
    bindHookCheck(AllowedActionsEnum.edit, 'beforeDatasourceRequest');    

    // create check
    bindHookCheck(AllowedActionsEnum.create, 'beforeSave');

    // edit check
    bindHookCheck(AllowedActionsEnum.edit, 'beforeSave');

    // delete check
    bindHookCheck(AllowedActionsEnum.delete, 'beforeSave');

    console.log('resourceConfig', resourceConfig);
  }
}