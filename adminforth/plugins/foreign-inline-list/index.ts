
import type { 
  AdminForthResource, 
  IAdminForth,
  IHttpServer,
} from "adminforth";

import { AdminForthPlugin, AdminForthResourcePages, suggestIfTypo } from "adminforth";
import { PluginOptions } from "./types.js";
import { interpretResource, ActionCheckSource } from "adminforth";

export default class ForeignInlineListPlugin extends AdminForthPlugin {
  foreignResource: AdminForthResource;
  options: PluginOptions;
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    return `${pluginOptions.foreignResourceId}`;
  }

  setupEndpoints(server: IHttpServer) {
    process.env.HEAVY_DEBUG && console.log(`🪲 ForeignInlineListPlugin.setupEndpoints, registering: '/plugin/${this.pluginInstanceId}/get_resource'`);
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_resource`,
      handler: async ({ body, adminUser }) => {
        const resource = this.adminforth.config.resources.find((res) => this.options.foreignResourceId === res.resourceId);
        if (!resource) {
          return { error: `Resource ${this.options.foreignResourceId} not found` };
        }
        // exclude "plugins" key
        const resourceCopy = JSON.parse(JSON.stringify({ ...resource, plugins: undefined }));
        const { allowedActions } = await interpretResource(adminUser, resource, {}, ActionCheckSource.DisplayButtons, this.adminforth);

        
        if (this.options.modifyTableResourceConfig) {
          this.options.modifyTableResourceConfig(resourceCopy);
        }
        return { 
          resource: { 
            ...resourceCopy,
            options: {
              ...resourceCopy.options,
              allowedActions,
            },
          }
        };
      }
    });

  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;

    // get resource with foreignResourceId
    this.foreignResource = adminforth.config.resources.find((resource) => resource.resourceId === this.options.foreignResourceId);
    if (!this.foreignResource) {
      const similar = suggestIfTypo(adminforth.config.resources.map((res) => res.resourceId), this.options.foreignResourceId);
      throw new Error(`ForeignInlineListPlugin: Resource with ID "${this.options.foreignResourceId}" not found. ${similar ? `Did you mean "${similar}"?` : ''}`);
    }
    resourceConfig.columns.push({
      name: `foreignInlineList_${this.foreignResource.resourceId}`,
      label: 'Foreign Inline List',
      virtual: true,
      showIn: [AdminForthResourcePages.show],
      components: {
        showRow: { 
          file: this.componentPath('InlineList.vue'),
          meta: {
            ...this.options, 
            pluginInstanceId: this.pluginInstanceId
          }
        }
      },
    });
  }
}