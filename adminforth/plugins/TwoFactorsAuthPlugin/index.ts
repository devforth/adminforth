import { ok } from "assert";
import { AdminForthResource, AdminForthResourcePages, AdminForthClass, GenericHttpServer } from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import twofactor from 'node-2fa';


export default class TwoFactorsAuthPlugin extends AdminForthPlugin {
  options: any;
  adminforth: AdminForthClass;
  authResource: AdminForthResource;

  constructor(options: any,  ) {
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
    this.activate(resourceConfig,adminforth)
  }

  activate(resourceConfig: AdminForthResource,adminforth: AdminForthClass){
    if (!this.options.twoFaSecretFieldName){
      throw new Error('twoFaSecretFieldName is required')
    }
    if (typeof this.options.twoFaSecretFieldName !=='string'){
      throw new Error('twoFaSecretFieldName must be a string')
    }
    this.authResource = resourceConfig
    if(!this.authResource.columns.some((col)=>col.name === this.options.twoFaSecretFieldName)){
      throw new Error(`Column ${this.options.twoFaSecretFieldName} not found in ${this.authResource.label}`)
    }
    const beforeLoginConfirmation = this.adminforth.config.auth as any
    if (!beforeLoginConfirmation.beforeLoginConfirmation){
      beforeLoginConfirmation.beforeLoginConfirmation = []
    } 
    beforeLoginConfirmation.beforeLoginConfirmation.push(async({adminUser})=>{
      if(adminUser.isRoot){
        return { body: {loginAllowed: true}, ok: true}
      }
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
      const totpTemporaryJWT = this.adminforth.auth.issueJWT({userName, newSecret},'temptotp', ) 
      return { 
        body:{
          loginAllowed: false,
          redirectTo: secret ? '/confirm2fa' : '/setup2fa', 
          setCookie: [{
            name: 'totpTemporaryJWT', 
            value: totpTemporaryJWT,
            expiry: '1h',
            httpOnly: true
          }]},
        ok: true
      }
    })
  }

  setupEndpoints(server: GenericHttpServer): void {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/initSetup`,
      handler: async ({ body, adminUser }) => {
        console.log('initSetup', body)
      }
    })
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/confirmSetup`,
      handler: async ({ body, adminUser }) => {
        console.log('confirmSetup', body)
      }
    })
  }
}