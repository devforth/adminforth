import { 
  AdminForthResource, AdminForthClass, BeforeDataSourceRequestFunction,
  AllowedActionsEnum,
  BeforeSaveFunction
} from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import { PluginOptions } from "./types.js";



export default class AuditLogPlugin extends AdminForthPlugin {
 
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

  }
}