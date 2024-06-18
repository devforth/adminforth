import { AdminForthResource, AdminForthResourcePages, AdminForthClass, GenericHttpServer } from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";

type PluginOptions = {
  foreignResourceId: string;
  listPageSize?: number;
  modifyTableResourceConfig?: (resourceConfig: AdminForthResource) => void;
}

export default class ForeignInlineListPlugin extends AdminForthPlugin {
  foreignResource: AdminForthResource;
  options: PluginOptions;
  adminforth: AdminForthClass;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  setupEndpoints(server: GenericHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_resource`,
      handler: async ({ body }) => {
        const resource = this.adminforth.config.resources.find((res) => this.options.foreignResourceId === res.resourceId);
        if (!resource) {
          return { error: `Resource ${this.options.foreignResourceId} not found` };
        }
        // exclude "plugins" key
        const resourceCopy = { ...resource, plugins: undefined };
        if (this.options.modifyTableResourceConfig) {
          this.options.modifyTableResourceConfig(resourceCopy);
        }
        return { resource: resourceCopy };
      },
    });

  }

  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;

    // get resource with foreignResourceId
    this.foreignResource = adminforth.config.resources.find((resource) => resource.resourceId === this.options.foreignResourceId);
    if (!this.foreignResource) {
      throw new Error(`ForeignInlineListPlugin: Resource with ID "${this.options.foreignResourceId}" not found`);
    }
    console.log('🔌 ForeignInlineListPlugin', this.options);
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