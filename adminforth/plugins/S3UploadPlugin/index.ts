
import { AdminForthClass, GenericHttpServer } from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import { PluginOptions } from './types.js';
import AWS from 'aws-sdk';

export default class S3UploadPlugin extends AdminForthPlugin {
  options: PluginOptions;
  adminforth: AdminForthClass;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: any) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    // after column to store the path of the uploaded file, add new VirtualColumn,
    // show only in edit and create views
    // use component s3uploader.vue
    const { pathColumnName, uploadColumnLabel } = this.options;

    const pluginFrontendOptions = {
      allowedExtensions: this.options.allowedFileExtensions,
      maxFileSize: this.options.maxFileSize,
      pluginInstanceId: this.pluginInstanceIdб
    };
    const virtualColumn = {
      virtual: true,
      name: `s3uploader_${this.pluginInstanceId}`,
      label: uploadColumnLabel,
      components: {
        edit: {
          file: this.componentPath('s3uploader.vue'),
          meta: pluginFrontendOptions,
        },
        create: {
          file: this.componentPath('s3uploader.vue'),
          meta: pluginFrontendOptions,
        }
      },
      onlyIn: ['edit', 'create'],
      options: {
        pathColumnName
      }
    };

    const pathColumnIndex = resourceConfig.columns.findIndex((column: any) => column.name === pathColumnName);
    if (pathColumnIndex === -1) {
      throw new Error(`Column with name "${pathColumnName}" not found in resource "${resourceConfig.name}"`);
    }

    // insert virtual column after path column if it is not already there
    const virtualColumnIndex = resourceConfig.columns.findIndex((column: any) => column.name === virtualColumn.name);
    if (virtualColumnIndex === -1) {
      resourceConfig.columns.splice(pathColumnIndex + 1, 0, virtualColumn);
    }

    // if showIn of path column has 'create' or 'edit' remove it
    const pathColumn = resourceConfig.columns[pathColumnIndex];
    if (pathColumn.showIn && (pathColumn.showIn.includes('create') || pathColumn.showIn.includes('edit'))) {
      pathColumn.showIn = pathColumn.showIn.filter((view: string) => !['create', 'edit'].includes(view));
    }
  }

  setupEndpoints(server: GenericHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_s3_upload_url`,
      handler: async ({ body }) => {
        const { originalFilename, contentType } = body;
        const originalExtension = originalFilename.split('.').pop();

        if (this.options.allowedFileExtensions && !this.options.allowedFileExtensions.includes(originalExtension)) {
          throw new Error(`File extension "${originalExtension}" is not allowed, allowed extensions are: ${this.options.allowedFileExtensions.join(', ')}`);
        }

        const s3Path: string = this.options.s3Path({ originalFilename, originalExtension, contentType });
        const s3 = new AWS.S3({
          accessKeyId: this.options.s3AccessKeyId,
          secretAccessKey: this.options.s3SecretAccessKey,
          region: this.options.s3Region
        });

        const params = {
          Bucket: this.options.s3Bucket,
          Key: s3Path,
          ContentType: contentType,
          ACL: this.options.s3ACL
        };

        const url = s3.getSignedUrl('putObject', params);

        let previewUrl;
        if (this.options.previewUrl) {
          previewUrl = this.options.previewUrl({ s3Path });
        } else {
          // generate presigned url for reading the file
          previewUrl = s3.getSignedUrl('getObject', {
            Bucket: this.options.s3Bucket,
            Key: s3Path
          });
        }
        return {
          url,
          s3Path,
          previewUrl
        };
      }
    });
  }

}