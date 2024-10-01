
import { PluginOptions } from './types.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExpirationStatus, GetObjectCommand, ObjectCannedACL, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { AdminForthPlugin, AdminForthResourceColumn, AdminForthResourcePages, IAdminForth, IHttpServer } from "adminforth";

const ADMINFORTH_NOT_YET_USED_TAG = 'adminforth-candidate-for-cleanup';

export default class UploadPlugin extends AdminForthPlugin {
  options: PluginOptions;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    return `${pluginOptions.pathColumnName}`;
  }

  async setupLifecycleRule() {
    // check that lifecyle rule "adminforth-unused-cleaner" exists
    const CLEANUP_RULE_ID = 'adminforth-unused-cleaner';
    const s3 = new S3({
      credentials: {
        accessKeyId: this.options.s3AccessKeyId,
        secretAccessKey: this.options.s3SecretAccessKey,
      },

      region: this.options.s3Region,
    });
    // check bucket exists
    const bucketExists = s3.headBucket({ Bucket: this.options.s3Bucket })
    if (!bucketExists) {
      throw new Error(`Bucket ${this.options.s3Bucket} does not exist`);
    }

    // check that lifecycle rule exists
    let ruleExists: boolean = false;

    try {
        const lifecycleConfig: any = await s3.getBucketLifecycleConfiguration({ Bucket: this.options.s3Bucket });
        ruleExists = lifecycleConfig.Rules.some((rule: any) => rule.ID === CLEANUP_RULE_ID);
    } catch (e: any) {
      if (e.name !== 'NoSuchLifecycleConfiguration') {
        throw e;
      } else {
        ruleExists = false;
      }
    }

    if (!ruleExists) {
      // create
      // rule deletes object has tag adminforth-candidate-for-cleanup = true after 2 days
      const params = {
        Bucket: this.options.s3Bucket,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: CLEANUP_RULE_ID,
              Status: ExpirationStatus.Enabled,
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

      await s3.putBucketLifecycleConfiguration(params);
    }
  }

  async genPreviewUrl(record: any, s3: S3) {
    if (this.options.preview?.previewUrl) {
      record[`previewUrl_${this.pluginInstanceId}`] = this.options.preview.previewUrl({ s3Path: record[this.options.pathColumnName] });
      return;
    }
    const previewUrl = await await getSignedUrl(s3, new GetObjectCommand({
      Bucket: this.options.s3Bucket,
      Key: record[this.options.pathColumnName],
    }));

    record[`previewUrl_${this.pluginInstanceId}`] = previewUrl;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: any) {

    super.modifyResourceConfig(adminforth, resourceConfig);
    // after column to store the path of the uploaded file, add new VirtualColumn,
    // show only in edit and create views
    // use component uploader.vue
    const { pathColumnName } = this.options;

    const pluginFrontendOptions = {
      allowedExtensions: this.options.allowedFileExtensions,
      maxFileSize: this.options.maxFileSize,
      pluginInstanceId: this.pluginInstanceId,
    };
    const virtualColumn: AdminForthResourceColumn = {
      virtual: true,
      name: `uploader_${this.pluginInstanceId}`,
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
      showIn: ['edit', 'create', 'show', ...(this.options.preview?.showInList ? [
        AdminForthResourcePages.list
      ] : [])],
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

    virtualColumn.required = pathColumn.required;
    virtualColumn.label = pathColumn.label;
    virtualColumn.editingNote = pathColumn.editingNote;

    // ** HOOKS FOR CREATE **//

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
      process.env.HEAVY_DEBUG && console.log('💾💾  after save ', record?.id);
      
      if (record[pathColumnName]) {
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });
        process.env.HEAVY_DEBUG && console.log('🪥🪥 remove ObjectTagging', record[pathColumnName]);
        // let it crash if it fails: this is a new file which just was uploaded.
        await s3.putObjectTagging({
          Bucket: this.options.s3Bucket,
          Key: record[pathColumnName],
          Tagging: {
            TagSet: []
          }
        });
      }
      return { ok: true };
    });

    // ** HOOKS FOR SHOW **//


    // add show hook to get presigned URL
    resourceConfig.hooks.show.afterDatasourceResponse.push(async ({ response }: { response: any }) => {
      const record = response[0];
      if (!record) {
        return { ok: true };
      }
      if (record[pathColumnName]) {
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });

        await this.genPreviewUrl(record, s3);
      }
      return { ok: true };
    });

    // ** HOOKS FOR LIST **//


    if (this.options.preview?.showInList) {
      resourceConfig.hooks.list.afterDatasourceResponse.push(async ({ response }: { response: any }) => {
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });
  
       await Promise.all(response.map(async (record: any) => {
          if (record[this.options.pathColumnName]) {
            await this.genPreviewUrl(record, s3);
          }
        }));
        return { ok: true };
      })
    }

    // ** HOOKS FOR DELETE **//

    // add delete hook which sets tag adminforth-candidate-for-cleanup to true
    resourceConfig.hooks.delete.afterSave.push(async ({ record }: { record: any }) => {
      if (record[pathColumnName]) {
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });

        try {
          await s3.putObjectTagging({
            Bucket: this.options.s3Bucket,
            Key: record[pathColumnName],
            Tagging: {
              TagSet: [
                {
                  Key: ADMINFORTH_NOT_YET_USED_TAG,
                  Value: 'true'
                }
              ]
            }
          });
        } catch (e) {
          // file might be e.g. already deleted, so we catch error
          console.error(`Error setting tag ${ADMINFORTH_NOT_YET_USED_TAG} to true for object ${record[pathColumnName]}. File will not be auto-cleaned up`, e);
        }
      }
      return { ok: true };
    });


    // ** HOOKS FOR EDIT **//

    // beforeSave
    resourceConfig.hooks.edit.beforeSave.push(async ({ record }: { record: any }) => {
      // null is when value is removed
      if (record[virtualColumn.name] || record[virtualColumn.name] === null) {
        record[pathColumnName] = record[virtualColumn.name];
      }
      return { ok: true };
    })


    // add edit postSave hook to delete old file and remove tag from new file
    resourceConfig.hooks.edit.afterSave.push(async ({ record, oldRecord }: { record: any, oldRecord: any }) => {

      if (record[virtualColumn.name] || record[virtualColumn.name] === null) {
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });

        if (oldRecord[pathColumnName]) {
          // put tag to delete old file
          try {
            await s3.putObjectTagging({
              Bucket: this.options.s3Bucket,
              Key: oldRecord[pathColumnName],
              Tagging: {
                TagSet: [
                  {
                    Key: ADMINFORTH_NOT_YET_USED_TAG,
                    Value: 'true'
                  }
                ]
              }
            });
          } catch (e) {
            // file might be e.g. already deleted, so we catch error
            console.error(`Error setting tag ${ADMINFORTH_NOT_YET_USED_TAG} to true for object ${oldRecord[pathColumnName]}. File will not be auto-cleaned up`, e);
          }
        }
        if (record[virtualColumn.name] !== null) {
          // remove tag from new file
          // in this case we let it crash if it fails: this is a new file which just was uploaded. 
          await s3.putObjectTagging({
            Bucket: this.options.s3Bucket,
            Key: record[pathColumnName],
            Tagging: {
              TagSet: []
            }
          });
        }
      }
      return { ok: true };
    });

    
  }

  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: any) {
    // called here because modifyResourceConfig can be called in build time where there is no environment and AWS secrets
    this.setupLifecycleRule();
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_s3_upload_url`,
      handler: async ({ body }) => {
        const { originalFilename, contentType, size, originalExtension } = body;

        if (this.options.allowedFileExtensions && !this.options.allowedFileExtensions.includes(originalExtension)) {
          return {
            error: `File extension "${originalExtension}" is not allowed, allowed extensions are: ${this.options.allowedFileExtensions.join(', ')}`
          };
        }

        const s3Path: string = this.options.s3Path({ originalFilename, originalExtension, contentType });
        if (s3Path.startsWith('/')) {
          throw new Error('s3Path should not start with /, please adjust s3path function to not return / at the start of the path');
        }
        const s3 = new S3({
          credentials: {
            accessKeyId: this.options.s3AccessKeyId,
            secretAccessKey: this.options.s3SecretAccessKey,
          },

          region: this.options.s3Region,
        });

        const tagline = `${ADMINFORTH_NOT_YET_USED_TAG}=true`;
        const params = {
          Bucket: this.options.s3Bucket,
          Key: s3Path,
          ContentType: contentType,
          ACL: (this.options.s3ACL || 'private') as  ObjectCannedACL,
          Tagging: tagline,
        };

        const uploadUrl = await await getSignedUrl(s3, new PutObjectCommand(params), {
          expiresIn: 1800,
          unhoistableHeaders: new Set(['x-amz-tagging']),
        });

        let previewUrl;
        if (this.options.preview?.previewUrl) {
          previewUrl = this.options.preview.previewUrl({ s3Path });
          return;
        } else if (this.options.s3ACL === 'public-read') {
          previewUrl = `https://${this.options.s3Bucket}.s3.${this.options.s3Region}.amazonaws.com/${s3Path}`;
        } else {
          previewUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: this.options.s3Bucket,
            Key: s3Path,
          }));
        }
        
        return {
          uploadUrl,
          s3Path,
          tagline,
          previewUrl,
        };
      }
    });
  }

}