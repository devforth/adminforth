import { AdminForthResource, AdminForthResourcePages, AdminForthClass, GenericHttpServer } from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import twofactor from 'node-2fa';


export default class TwoFactorsAuthPlugin extends AdminForthPlugin {
  options: any;
  adminforth: AdminForthClass;
  authResource: AdminForthResource;

  constructor(options: any, adminforth: AdminForthClass, authResource: AdminForthResource) {
    super(options, import.meta.url);
    this.options = options;
    this.authResource = authResource
   
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

  activate(resourceConfig: AdminForthResource,adminforth: AdminForthClass){
    if (!this.options.twoFaSecretFieldName){
      throw new Error('twoFaSecretFieldName is required')
    }
    if (typeof this.options.twoFaSecretFieldName !=='string'){
      throw new Error('twoFaSecretFieldName must be a string')
    }
    if(!this.authResource.columns[this.options.twoFaSecretFieldName]){
      throw new Error(`Column ${this.options.twoFaSecretFieldName} not found in ${this.authResource.label}`)
    }
    const beforeLoginConfirmation = this.adminforth.config.auth
    if (!beforeLoginConfirmation.beforeLoginConfirmation){
      beforeLoginConfirmation.beforeLoginConfirmation = []
    } 
    beforeLoginConfirmation.beforeLoginConfirmation.push(async({adminUser})=>{
      const secret = adminUser.dbUser[this.options.twoFaSecretFieldName]
      const userName = adminUser.dbUser[adminforth.config.auth.usernameField]
      const brandName = adminforth.config.customization.brandName
      // const userPk = adminUser.dbUser[adminforth.config.auth.pkField] 
      let newSecret = null
      if (!secret){
        const tempSecret = twofactor.generateSecret({name: brandName,account: userName})
        newSecret = tempSecret.secret
      } else {
        return {
          loginAllowed: false,
          redirectTo: '/confirm2fa'
        }
      }
      const totpTemporaryJWT = this.adminforth.auth.issueJWT({userName, newSecret}) 



    })
  }
}