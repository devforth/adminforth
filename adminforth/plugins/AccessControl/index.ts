import { 
  AdminForthResource, AdminForthClass, BeforeDataSourceRequestFunction,
  AllowedActionsEnum
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


    const bindHookCheck = (action: AllowedActionsEnum, hookName: string) => {
      if (!resourceConfig.hooks[action]) {
        resourceConfig.hooks[action] = {};
      }
      if (!resourceConfig.hooks[action][hookName]) {
        resourceConfig.hooks[action][hookName] = [];
      }
      (resourceConfig.hooks[action][hookName] as Array<BeforeDataSourceRequestFunction>).unshift(
        async (resource: AdminForthResource, adminUser: any, query: any) => {
          
          const hasAccessOrError = await this.options.hasAccess(adminUser, action);
          if (hasAccessOrError === true) {
            return { ok: true };
          } else {
            return { ok: false, error: hasAccessOrError || AccessControlPlugin.defaultError };
          }
        }
      );
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