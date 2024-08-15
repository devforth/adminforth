
import { IAdminForth, IHttpServer, AdminForthPlugin, AdminForthResource } from "adminforth";
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
        debounceTime: this.options.completion?.expert?.debounceTime || 300,
        shouldComplete: !!this.options.completion,
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
    if (this.options.completion && this.options.completion.provider !== 'openai-chat-gpt') {
      throw new Error(`Invalid provider ${this.options.completion.provider}`);
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
      handler: async ({ body }) => {
        const { record } = body;
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
        const stop = this.options.completion.expert?.stop || ['.'];
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.options.completion.params.apiKey}`
          },
          body: JSON.stringify({
            model: this.options.completion.params.model || 'gpt-4o-mini',
            messages: [
              {
                role: 'user', 
                content,
              }
            ],
            temperature: this.options.completion.expert?.temperature || 0.7,
            max_tokens: this.options.completion.expert?.maxTokens || 50,
            stop,
          })
        });
        const data = await resp.json();
        let suggestion = data.choices[0].message.content + (
          data.choices[0].finish_reason === 'stop' ? (
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