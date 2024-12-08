import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo, AdminForthDataTypes } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthResource, BeforeLoginConfirmationFunction } from "adminforth";
import type { PluginOptions } from './types.js';
import iso6391 from 'iso-639-1';

export default class OpenSignupPlugin extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  passwordField: AdminForthResourceColumn;
  authResource: AdminForthResource;
  emailConfirmedField?: AdminForthResourceColumn;
  
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

    // check each supported language is valid ISO 639-1 code
    this.options.supportedLanguages.forEach((lang) => {
      console.log('lang', lang);
      if (!iso6391.validate(lang)) {
        throw new Error(`Invalid language code ${lang}, please define valid ISO 639-1 language code (2 lowercase letters)`);
      }
    });




    // add underLogin component
    (adminforth.config.customization.loginPageInjections.underInputs as AdminForthComponentDeclaration[]).push({ 
      file: this.componentPath('LanguageUnderLogin.vue'),
      meta: { 
        brandSlug: adminforth.config.customization.brandNameSlug,
        pluginInstanceId: this.pluginInstanceId,
        supportedLanguages: this.options.supportedLanguages.map(lang => (
          {
            code: lang,
            // lang name on on language native name
            name: iso6391.getNativeName(lang),
          }
        ))
      }
    });

  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }


  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'GET',
      path: `/plugin/${this.pluginInstanceId}/frontend_messages`,
      noAuth: true,
      handler: async ({ query }) => {
        console.log('query', query);
        const lang = query.lang;
        if (lang === 'ja') {
          return {
            Info: '情報',
            'Sign in to': 'サインイン',
          }
        }
        return {
        }
      }
    });

  }

}