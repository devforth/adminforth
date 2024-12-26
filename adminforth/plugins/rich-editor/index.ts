
import type { IAdminForth, IHttpServer, AdminForthResource, AdminUser } from "adminforth";
import type { PluginOptions } from './types.js';
import { AdminForthPlugin, Filters, RateLimiter } from "adminforth";
import * as cheerio from 'cheerio';


// options:
// attachments: {
//   attachmentResource: 'description_images',
//   attachmentFieldName: 'image_path',
//   attachmentRecordIdFieldName: 'record_id',
//   attachmentResourceIdFieldName: 'resource_id',
// },

export default class RichEditorPlugin extends AdminForthPlugin {
  options: PluginOptions;
  resourceConfig: AdminForthResource = undefined;

  uploadPlugin: AdminForthPlugin;

  activationOrder: number = 100000;

  attachmentResource: AdminForthResource = undefined;

  adminforth: IAdminForth;
  
  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;

    const c = resourceConfig.columns.find(c => c.name === this.options.htmlFieldName);
    if (!c) {
      throw new Error(`Column ${this.options.htmlFieldName} not found in resource ${resourceConfig.label}`);
    }
    
    if (this.options.attachments) {
      const resource = adminforth.config.resources.find(r => r.resourceId === this.options.attachments!.attachmentResource);
      if (!resource) {
        throw new Error(`Resource '${this.options.attachments!.attachmentResource}' not found`);
      }
      this.attachmentResource = resource;
      const field = resource.columns.find(c => c.name === this.options.attachments!.attachmentFieldName);
      if (!field) {
        throw new Error(`Field '${this.options.attachments!.attachmentFieldName}' not found in resource '${this.options.attachments!.attachmentResource}'`);
      }
      const plugin = adminforth.activatedPlugins.find(p => 
        p.resourceConfig!.resourceId === this.options.attachments!.attachmentResource && 
        p.pluginOptions.pathColumnName === this.options.attachments!.attachmentFieldName
      );
      if (!plugin) {
        throw new Error(`Plugin for attachment field '${this.options.attachments!.attachmentFieldName}' not found in resource '${this.options.attachments!.attachmentResource}', please check if Upload Plugin is installed on the field ${this.options.attachments!.attachmentFieldName}`);
      }

      if (plugin.pluginOptions.s3ACL !== 'public-read') {
        throw new Error(`Upload Plugin for attachment field '${this.options.attachments!.attachmentFieldName}' in resource '${this.options.attachments!.attachmentResource}' 
          should have s3ACL set to 'public-read' (in vast majority of cases signed urls inside of HTML text is not desired behavior, so we did not implement it)`);
      }
      this.uploadPlugin = plugin;
    }

    const filed = {
      file: this.componentPath('quillEditor.vue'),
      meta: {
        pluginInstanceId: this.pluginInstanceId,
        debounceTime: this.options.completion?.expert?.debounceTime || 300,
        shouldComplete: !!this.options.completion,
        uploadPluginInstanceId: this.uploadPlugin?.pluginInstanceId,
      }
    }

    if (!c.components) {
      c.components = {};
    }
    c.components.create = filed;
    c.components.edit = filed;

    const editorRecordPkField = resourceConfig.columns.find(c => c.primaryKey);


    // if attachment configured we need a post-save hook to create attachment records for each image data-s3path
    if (this.options.attachments) {

      function getAttachmentPathes(html: string) {
        if (!html) {
          return [];
        }
        const $ = cheerio.load(html);
        const s3Paths = [];
        $('img[data-s3path]').each((i, el) => {
          const src = $(el).attr('data-s3path');
          s3Paths.push(src);
        });
        return s3Paths;
      }

      const createAttachmentRecords = async (
        adminforth: IAdminForth, options: PluginOptions, recordId: any, s3Paths: string[], adminUser: AdminUser
      ) => {
        process.env.HEAVY_DEBUG && console.log('📸 Creating attachment records', JSON.stringify(recordId))
        await Promise.all(s3Paths.map(async (s3Path) => {
          await adminforth.createResourceRecord(
            {
              resource: this.attachmentResource,
              record: {
                [options.attachments.attachmentFieldName]: s3Path,
                [options.attachments.attachmentRecordIdFieldName]: recordId,
                [options.attachments.attachmentResourceIdFieldName]: resourceConfig.resourceId,
              },
              adminUser
            }
          )
        }
        ));
      }

      const deleteAttachmentRecords = async (
        adminforth: IAdminForth, options: PluginOptions, s3Paths: string[], adminUser: AdminUser
      ) => {
        
        const attachmentPrimaryKeyField = this.attachmentResource.columns.find(c => c.primaryKey);
        
        const attachments = await adminforth.resource(options.attachments.attachmentResource).list(
          Filters.IN(options.attachments.attachmentFieldName, s3Paths)
        );

        await Promise.all(attachments.map(async (a: any) => {
          await adminforth.deleteResourceRecord(
            {
              resource: this.attachmentResource,
              recordId: a[attachmentPrimaryKeyField.name],
              adminUser,
              record: a,
            }
          )
        }))
      }
      

      (resourceConfig.hooks.create.afterSave).push(async ({ record, adminUser }: { record: any, adminUser: AdminUser }) => {
        // find all s3Paths in the html
        const s3Paths = getAttachmentPathes(record[this.options.htmlFieldName])
        
        process.env.HEAVY_DEBUG && console.log('📸 Found s3Paths', s3Paths);

        // create attachment records
        await createAttachmentRecords(
          adminforth, this.options, record[editorRecordPkField.name], s3Paths, adminUser);

        return { ok: true };
      });

      // after edit we need to delete attachments that are not in the html anymore
      // and add new ones
      (resourceConfig.hooks.edit.afterSave).push(
        async ({ recordId, record, adminUser }: { recordId: any, record: any, adminUser: AdminUser }) => {
          process.env.HEAVY_DEBUG && console.log('⚓ Cought hook', recordId, 'rec', record);
          if (record[this.options.htmlFieldName] === undefined) {
            // field was not changed, do nothing
            return { ok: true };
          }
          const existingAparts = await adminforth.resource(this.options.attachments.attachmentResource).list([
            Filters.EQ(this.options.attachments.attachmentRecordIdFieldName, recordId),
            Filters.EQ(this.options.attachments.attachmentResourceIdFieldName, resourceConfig.resourceId)
          ]);
          const existingS3Paths = existingAparts.map((a: any) => a[this.options.attachments.attachmentFieldName]);
          const newS3Paths = getAttachmentPathes(record[this.options.htmlFieldName]);
          process.env.HEAVY_DEBUG && console.log('📸 Existing s3Paths (from db)', existingS3Paths)
          process.env.HEAVY_DEBUG && console.log('📸 Found new s3Paths (from text)', newS3Paths);
          const toDelete = existingS3Paths.filter(s3Path => !newS3Paths.includes(s3Path));
          const toAdd = newS3Paths.filter(s3Path => !existingS3Paths.includes(s3Path));
          process.env.HEAVY_DEBUG && console.log('📸 Found s3Paths to delete', toDelete)
          process.env.HEAVY_DEBUG && console.log('📸 Found s3Paths to add', toAdd);

          await Promise.all([
            deleteAttachmentRecords(adminforth, this.options, toDelete, adminUser),
            createAttachmentRecords(adminforth, this.options, recordId, toAdd, adminUser)
          ]);

          return { ok: true };

        }
      );

      // after delete we need to delete all attachments
      (resourceConfig.hooks.delete.afterSave).push(
        async ({ record, adminUser }: { record: any, adminUser: AdminUser }) => {
          const existingAparts = await adminforth.resource(this.options.attachments.attachmentResource).list(
            [
              Filters.EQ(this.options.attachments.attachmentRecordIdFieldName, record[editorRecordPkField.name]),
              Filters.EQ(this.options.attachments.attachmentResourceIdFieldName, resourceConfig.resourceId)
            ]
          );
          const existingS3Paths = existingAparts.map((a: any) => a[this.options.attachments.attachmentFieldName]);
          process.env.HEAVY_DEBUG && console.log('📸 Found s3Paths to delete', existingS3Paths);
          await deleteAttachmentRecords(adminforth, this.options, existingS3Paths, adminUser);

          return { ok: true };
        }
      );
    }
  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    this.adminforth = adminforth;
    if (this.options.completion?.adapter) {
      this.options.completion?.adapter.validate();
    }
    // optional method where you can safely check field types after database discovery was performed
    if (this.options.completion && !this.options.completion.adapter) {
      throw new Error(`Completion adapter is required`);
    }

  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return pluginOptions.htmlFieldName;
  }

  generateRecordContext(record: any, maxFields: number, inputFieldLimit: number, partsCount: number): string {
    // stringify each field
    let fields: [string, string][] = Object.entries(record).map(([key, value]) => {
      return [key, JSON.stringify(value)];
    });

    // sort fields by length, higher first
    fields = fields.sort((a, b) => b[1].length - a[1].length);

    // select longest maxFields fields
    fields = fields.slice(0, maxFields);

    const minLimit = '...'.length * partsCount;

    if (inputFieldLimit < minLimit) {
      throw new Error(`inputFieldLimit should be at least ${minLimit}`);
    }

    // for each field, if it is longer than inputFieldLimit, truncate it using next way:
    // split into 5 parts, divide inputFieldLimit by 5, crop each part to this length, join parts using '...'
    fields = fields.map(([key, value]) => {
      if (value.length > inputFieldLimit) {
        const partLength = Math.floor(inputFieldLimit / partsCount) - '...'.length;
        const parts: string[] = [];
        for (let i = 0; i < partsCount; i++) {
          parts.push(value.slice(i * partLength, (i + 1) * partLength));
        }
        value = parts.join('...');
        return [key, value];
      }
      return [key, value];
    });

    return JSON.stringify(Object.fromEntries(fields));
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/doComplete`,
      handler: async ({ body, headers }) => {
        const { record } = body;

        if (this.options.completion.rateLimit?.limit) {
          // rate limit
          const { error } = RateLimiter.checkRateLimit(
            this.pluginInstanceId, 
            this.options.completion.rateLimit?.limit,
            this.adminforth.auth.getClientIp(headers),
          );
          if (error) {
            return {
              completion: [],
            }
          }
        }

        const recordNoField = {...record};
        delete recordNoField[this.options.htmlFieldName];
        let currentVal = record[this.options.htmlFieldName] as string;
        const promptLimit = this.options.completion.expert?.promptInputLimit || 500;
        const inputContext = this.generateRecordContext(
          recordNoField,
          this.options.completion.expert?.recordContext?.maxFields || 5, 
          this.options.completion.expert?.recordContext?.maxFieldLength || 300,
          this.options.completion.expert?.recordContext?.splitParts || 5,
        );

        if (currentVal && currentVal.length > promptLimit) {
          currentVal = currentVal.slice(-promptLimit);
        }

        const resLabel = this.resourceConfig!.label;
       
        let content;
        
        if (currentVal) {
          content = `Continue writing for text/string field "${this.options.htmlFieldName}" in the table "${resLabel}"\n` +
              (Object.keys(recordNoField).length > 0 ? `Record has values for the context: ${inputContext}\n` : '') +
              `Current field value: ${currentVal}\n` +
              "Don't talk to me. Just write text. No quotes. Don't repeat current field value, just write completion\n";

        } else {
          content = `Fill text/string field "${this.options.htmlFieldName}" in the table "${resLabel}"\n` +
              (Object.keys(recordNoField).length > 0 ? `Record has values for the context: ${inputContext}\n` : '') +
              "Be short, clear and precise. No quotes. Don't talk to me. Just write text\n";
        }

        process.env.HEAVY_DEBUG && console.log('🪲 OpenAI Prompt 🧠', content);
        const { content: respContent, finishReason } = await this.options.completion.adapter.complete(content, this.options.completion?.expert?.stop, this.options.completion?.expert?.maxTokens);
        const stop = this.options.completion.expert?.stop || ['.'];
        let suggestion = respContent + (
          finishReason === 'stop' ? (
            stop[0] === '.' && stop.length === 1 ? '. ' : ''
          ) : ''
        );

        if (suggestion.startsWith(currentVal)) {
          suggestion = suggestion.slice(currentVal.length);
        }
        const wordsList = suggestion.split(' ').map((w, i) => {
          return (i === suggestion.split(' ').length - 1) ? w : w + ' ';
        });

        // remove quotes from start and end
        return {
          completion: wordsList
        };
      }
    });

  }

}