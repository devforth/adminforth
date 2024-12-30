
import { PluginOptions } from './types.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExpirationStatus, GetObjectCommand, ObjectCannedACL, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { AdminForthPlugin, AdminForthResourceColumn, AdminForthResource, Filters, IAdminForth, IHttpServer, suggestIfTypo } from "adminforth";
import { Readable } from "stream";
import { RateLimiter } from "adminforth";

const ADMINFORTH_NOT_YET_USED_TAG = 'adminforth-candidate-for-cleanup';

export default class UploadPlugin extends AdminForthPlugin {
  options: PluginOptions;

  adminforth!: IAdminForth;

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
        console.error(`⛔ Error checking lifecycle configuration, please check keys have permissions to 
getBucketLifecycleConfiguration on bucket ${this.options.s3Bucket} in region ${this.options.s3Region}. Exception:`, e);
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

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    // after column to store the path of the uploaded file, add new VirtualColumn,
    // show only in edit and create views
    // use component uploader.vue
    const { pathColumnName } = this.options;
    const pathColumnIndex = resourceConfig.columns.findIndex((column: any) => column.name === pathColumnName);
    if (pathColumnIndex === -1) {
      throw new Error(`Column with name "${pathColumnName}" not found in resource "${resourceConfig.label}"`);
    }

    if (this.options.generation?.fieldsForContext) {
      this.options.generation?.fieldsForContext.forEach((field: string) => {
        if (!resourceConfig.columns.find((column: any) => column.name === field)) {
          const similar = suggestIfTypo(resourceConfig.columns.map((column: any) => column.name), field);
          throw new Error(`Field "${field}" specified in fieldsForContext not found in
 resource "${resourceConfig.label}". ${similar ? `Did you mean "${similar}"?` : ''}`);
        }
      });
    }

    const pluginFrontendOptions = {
      allowedExtensions: this.options.allowedFileExtensions,
      maxFileSize: this.options.maxFileSize,
      pluginInstanceId: this.pluginInstanceId,
      resourceLabel: resourceConfig.label,
      generateImages: this.options.generation ? true : false,
      pathColumnLabel: resourceConfig.columns[pathColumnIndex].label,
      fieldsForContext: this.options.generation?.fieldsForContext,
      maxWidth: this.options.preview?.maxWidth,
    };
    // define components which will be imported from other components
    this.componentPath('imageGenerator.vue');

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
      },
      showIn: ['edit', 'create'],
    };

   

   
    if (!resourceConfig.columns[pathColumnIndex].components) {
      resourceConfig.columns[pathColumnIndex].components = {};
    }
    
    if (this.options.preview?.showInList || this.options.preview?.showInList === undefined) {
      // add preview column to list
      resourceConfig.columns[pathColumnIndex].components.list = {
        file: this.componentPath('preview.vue'),
        meta: pluginFrontendOptions,
      };
    }

    if (this.options.preview?.showInShow || this.options.preview?.showInShow === undefined) {
      resourceConfig.columns[pathColumnIndex].components.show = {
        file: this.componentPath('preview.vue'),
        meta: pluginFrontendOptions,
      };
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


    if (this.options.preview?.showInList || this.options.preview?.showInList === undefined) {
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
    resourceConfig.hooks.edit.afterSave.push(async ({ updates, oldRecord }: { updates: any, oldRecord: any }) => {

      if (updates[virtualColumn.name] || updates[virtualColumn.name] === null) {
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
        if (updates[virtualColumn.name] !== null) {
          // remove tag from new file
          // in this case we let it crash if it fails: this is a new file which just was uploaded. 
          await s3.putObjectTagging({
            Bucket: this.options.s3Bucket,
            Key: updates[pathColumnName],
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
    this.adminforth = adminforth;
    // called here because modifyResourceConfig can be called in build time where there is no environment and AWS secrets
    this.setupLifecycleRule();
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/get_s3_upload_url`,
      handler: async ({ body }) => {
        const { originalFilename, contentType, size, originalExtension, recordPk } = body;

        if (this.options.allowedFileExtensions && !this.options.allowedFileExtensions.includes(originalExtension)) {
          return {
            error: `File extension "${originalExtension}" is not allowed, allowed extensions are: ${this.options.allowedFileExtensions.join(', ')}`
          };
        }

        let record = undefined;
        if (recordPk) {
          // get record by recordPk
          const pkName = this.resourceConfig.columns.find((column: any) => column.primaryKey)?.name;
          record = await this.adminforth.resource(this.resourceConfig.resourceId).get(
            [Filters.EQ(pkName, recordPk)]
          )
        }

        const s3Path: string = this.options.s3Path({ originalFilename, originalExtension, contentType, record });
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

    // generation: {
    //   provider: 'openai-dall-e',
    //   countToGenerate: 3,
    //   openAiOptions: {
    //     model: 'dall-e-3',
    //     size: '1792x1024',
    //     apiKey: process.env.OPENAI_API_KEY as string,
    //   },
    // },

  //   curl https://api.openai.com/v1/images/generations \
  // -H "Content-Type: application/json" \
  // -H "Authorization: Bearer $OPENAI_API_KEY" \
  // -d '{
  //   "model": "dall-e-3",
  //   "prompt": "A cute baby sea otter",
  //   "n": 1,
  //   "size": "1024x1024"
  // }'

    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/generate_images`,
      handler: async ({ body, headers }) => {
        const { prompt } = body;

        if (this.options.generation.provider !== 'openai-dall-e') {
          throw new Error(`Provider ${this.options.generation.provider} is not supported`);
        }

        if (this.options.generation.rateLimit?.limit) {
          // rate limit
          const { error } = RateLimiter.checkRateLimit(
            this.pluginInstanceId, 
            this.options.generation.rateLimit?.limit,
            this.adminforth.auth.getClientIp(headers),
          );
          if (error) {
            return { error: this.options.generation.rateLimit.errorMessage };
          }
        }

        const { model, size, apiKey } = this.options.generation.openAiOptions;
        const url = 'https://api.openai.com/v1/images/generations';

        let error = null;
        const images = await Promise.all(
          (new Array(this.options.generation.countToGenerate)).fill(0).map(async () => {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                prompt,
                n: 1,
                size,
              })
            });

            const json = await response.json();
            if (json.error) {
              console.error('Error generating image', json.error);
              error = json.error;
              return;
            }
            
            return json;

          })
        );

        return { error, images };
      }
    });

    server.endpoint({
      method: 'GET',
      path: `/plugin/${this.pluginInstanceId}/cors-proxy`,
      handler: async ({ query, response  }) => {
        const { url } = query;
        const resp = await fetch(url);
        response.setHeader('Content-Type', resp.headers.get('Content-Type'));
        //@ts-ignore
        Readable.fromWeb( resp.body ).pipe( response.blobStream() );
        return null
      }
    });

  }

}