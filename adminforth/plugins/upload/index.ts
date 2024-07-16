
import { IAdminForth, IHttpServer } from "../../types/AdminForthConfig.js";
import { PluginOptions } from './types.js';
import AWS from 'aws-sdk';
import { AdminForthPlugin } from "adminforth";

const ADMINFORTH_NOT_YET_USED_TAG = 'adminforth-not-yet-used';

export default class UploadPlugin extends AdminForthPlugin {
  options: PluginOptions;
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);

    this.options = options;
  }

  async setupLifecycleRule() {
    // check that lifecyle rule "adminforth-unused-cleaner" exists
    const CLEANUP_RULE_ID = 'adminforth-unused-cleaner';
    const s3 = new AWS.S3({
      accessKeyId: this.options.s3AccessKeyId,
      secretAccessKey: this.options.s3SecretAccessKey,
      region: this.options.s3Region
    });
    // check bucket exists
    const bucketExists = s3.headBucket({ Bucket: this.options.s3Bucket }).promise()
    if (!bucketExists) {
      throw new Error(`Bucket ${this.options.s3Bucket} does not exist`);
    }

    // check that lifecycle rule exists
    let ruleExists = false;

    try {
        const lifecycleConfig = await s3.getBucketLifecycleConfiguration({ Bucket: this.options.s3Bucket }).promise();
        ruleExists = lifecycleConfig.Rules.some((rule: any) => rule.ID === CLEANUP_RULE_ID);
    } catch (e) {
      if (e.code !== 'NoSuchLifecycleConfiguration') {
        throw e;
      } else {
        ruleExists = null;
      }
    }

    if (!ruleExists) {
      // create
      // rule deletes object has tag adminforth-not-yet-used = true after 2 days
      const params = {
        Bucket: this.options.s3Bucket,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: CLEANUP_RULE_ID,
              Status: 'Enabled',
              Filter: {
                Tag: {
                  Key: ADMINFORTH_NOT_YET_USED_TAG,
                  Value: 'true'
                }
              },
              Expiration: {
                Days: 2
              }
            }
          ]
        }
      };

      await s3.putBucketLifecycleConfiguration(params).promise();
    }
  }

  async genPreviewUrl(record: any, s3: AWS.S3) {
    const previewUrl = await s3.getSignedUrl('getObject', {
      Bucket: this.options.s3Bucket,
      Key: record[this.options.pathColumnName],
    });

    record[`previewUrl_${this.pluginInstanceId}`] = previewUrl; // todo not updating
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: any) {
    this.setupLifecycleRule();

    super.modifyResourceConfig(adminforth, resourceConfig);
    // after column to store the path of the uploaded file, add new VirtualColumn,
    // show only in edit and create views
    // use component uploader.vue
    const { pathColumnName, uploadColumnLabel } = this.options;

    const pluginFrontendOptions = {
      allowedExtensions: this.options.allowedFileExtensions,
      maxFileSize: this.options.maxFileSize,
      pluginInstanceId: this.pluginInstanceId,
    };
    const virtualColumn = {
      virtual: true,
      name: `uploader_${this.pluginInstanceId}`,
      label: uploadColumnLabel,
      components: {
        edit: {
          file: this.componentPath('uploader.vue'),
          meta: pluginFrontendOptions,
        },
        create: {
          file: this.componentPath('uploader.vue'),
          meta: pluginFrontendOptions,
        },
        show: {
          file: this.componentPath('preview.vue'),
          meta: pluginFrontendOptions,
        },
        ...(
          this.options.preview?.showInList ? {
            list: {
              file: this.componentPath('preview.vue'),
              meta: pluginFrontendOptions,
            }
          } : {}
        ),
      },
      showIn: ['edit', 'create', 'show', ...(this.options.preview?.showInList ? ['list'] : [])],
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

    // add beforeSave hook to save virtual column to path column
    resourceConfig.hooks.create.beforeSave.push(async ({ record }: { record: any }) => {
      if (record[virtualColumn.name]) {
        record[pathColumnName] = record[virtualColumn.name];
        delete record[virtualColumn.name];
      }
      return { ok: true };
    });

    // in afterSave hook, aremove tag adminforth-not-yet-used from the file
    resourceConfig.hooks.create.afterSave.push(async ({ record }: { record: any }) => {
      if (record[pathColumnName]) {
        const s3 = new AWS.S3({
          accessKeyId: this.options.s3AccessKeyId,
          secretAccessKey: this.options.s3SecretAccessKey,
          region: this.options.s3Region
        });

        await s3.putObjectTagging({
          Bucket: this.options.s3Bucket,
          Key: record[pathColumnName],
          Tagging: {
            TagSet: []
          }
        }).promise();
      }
      return { ok: true };
    });

    // add show hook to get presigned URL
    resourceConfig.hooks.show.afterDatasourceResponse.push(async ({ response }: { response: any }) => {
      const record = response[0];
      if (!record) {
        return { ok: true };
      }
      if (record[pathColumnName]) {
        const s3 = new AWS.S3({
          accessKeyId: this.options.s3AccessKeyId,
          secretAccessKey: this.options.s3SecretAccessKey,
          region: this.options.s3Region
        });

        await this.genPreviewUrl(record, s3);
      }
      return { ok: true };
    });

    if (this.options.preview?.showInList) {
      resourceConfig.hooks.list.afterDatasourceResponse.push(async ({ response }: { response: any }) => {
        const s3 = new AWS.S3({
          accessKeyId: this.options.s3AccessKeyId,
          secretAccessKey: this.options.s3SecretAccessKey,
          region: this.options.s3Region
        });
  
       await Promise.all(response.map(async (record: any) => {
          if (record[this.options.pathColumnName]) {
            await this.genPreviewUrl(record, s3);
          }
        }));
        return { ok: true };
      })
    }

    
  }

 

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_s3_upload_url`,
      handler: async ({ body }) => {
        const { originalFilename, contentType, size, originalExtension } = body;

        if (this.options.allowedFileExtensions && !this.options.allowedFileExtensions.includes(originalExtension)) {
          throw new Error(`File extension "${originalExtension}" is not allowed, allowed extensions are: ${this.options.allowedFileExtensions.join(', ')}`);
        }

        const s3Path: string = this.options.s3Path({ originalFilename, originalExtension, contentType });
        if (s3Path.startsWith('/')) {
          throw new Error('s3Path should not start with /, please adjust s3path function to not return / at the start of the path');
        }
        const s3 = new AWS.S3({
          accessKeyId: this.options.s3AccessKeyId,
          secretAccessKey: this.options.s3SecretAccessKey,
          region: this.options.s3Region
        });

        const params = {
          Bucket: this.options.s3Bucket,
          Key: s3Path,
          ContentType: contentType,
          ACL: this.options.s3ACL || 'private',
          Tagging: `${ADMINFORTH_NOT_YET_USED_TAG}=true`,
        };

        const uploadUrl = await s3.getSignedUrl('putObject', params,)

        
        return {
          uploadUrl,
          s3Path,
        };
      }
    });
  }

}