
import { AdminForthResourcePages, IAdminForth, IHttpServer, AdminForthPlugin, AdminForthResourceColumn, AdminForthResource, AdminForthDataTypes  } from "adminforth";
import { PluginOptions } from './types.js';


export default class ChatGptPlugin extends AdminForthPlugin {
  options: PluginOptions;
  resourceConfig?: AdminForthResource = undefined;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.resourceConfig = resourceConfig;


    const c = resourceConfig.columns.find(c => c.name === this.options.htmlFieldName);
    if (!c) {
      throw new Error(`Column ${this.options.htmlFieldName} not found in resource ${resourceConfig.label}`);
    }
    const filed = {
      file: this.componentPath('quillEditor.vue'),
      meta: {
        pluginInstanceId: this.pluginInstanceId,
        debounceTime: this.options.expert?.debounceTime || 300,
      }
    }
    if (!c.components) {
      c.components = {};
    }
    c.components.create = filed;
    c.components.edit = filed;
    
  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return pluginOptions.htmlFieldName;
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/example`,
      handler: async ({ body }) => {
        const { name } = body;
        return { hey: `Hello ${name}` };
      }
    });
  }

}