import { AdminForthResource, AdminForthResourcePages, AdminForthClass, GenericHttpServer } from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";

export default class TwoFactorsAuthPlugin extends AdminForthPlugin {
  options: any;
  adminforth: AdminForthClass;

  constructor(options: any) {
    super(options, import.meta.url);
    this.options = options;
   
  }

  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;
    const customPages = this.adminforth.config.customization.customPages
    customPages.push({
      path:'/confirm2fa',
      component: this.componentPath('TwoFactorsConfirmation.vue')
    })
    customPages.push({
      path:'/setup2fa',
      component: this.componentPath('TwoFactorsSetup.vue')
    })
  }
}