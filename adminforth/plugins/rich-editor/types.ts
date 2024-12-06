import { CompletionAdapter } from "adminforth";

// example options ussage:
//{
//  htmlFieldName: 'description',
//  completion: {
//    provider: 'openai-chat-gpt',
//    params: {
//      apiKey: process.env.OPENAI_API_KEY as string,
//      model: 'gpt-4o',
//    },
//    expert: {
//      debounceTime: 250,
//    }
//  }
//}

export interface PluginOptions {

  /**
   * Field where plugin will auto-complete text. Should be string or text field.
   */
  htmlFieldName: string;


  /**
   * Quill toolbar setting, full toolbar:
   * 
   * ```
   * [
   *     ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
   *     ['blockquote', 'code-block', 'link'],
   *     // [ 'image', 'video', 'formula' ],
   *
   *     [{ 'header': 2 }, { 'header': 3 }],               // custom button values
   *     [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
   *     // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
   *     // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
   *     // [{ 'direction': 'rtl' }],                         // text direction
   *     // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
   *     // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
   *     // [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
   *     // [{ 'font': [] }],
   *     [{ 'align': [] }],
   *
   *     ['clean']  
   * ]  
   *```
   */
  toolbar?: any[];

  /**
   * The completion section is used to define the completion provider and its parameters.
   */
  completion?: {
    /**
     * Adapter for completion.
     */

    adapter: CompletionAdapter;

    /**
     * Expert settings
     */
    expert?: {
        /**
         * Number of tokens to generate. Default is 50. 1 token ~= ¾ words 
         */
        maxTokens?: number;

        /**
         * Maximum number of last characters which will be used for completion for target field. Default is 500.
         * Higher value will give better context but will cost more. 
         */
        promptInputLimit?: number;

        /**
         * Time in ms to wait after user stops typing before sending request to completion provider. Default is 300 ms.
         */
        debounceTime?: number;

        /**
         * Stop completion on these characters. Default is ['.']
         */
        stop?: string[];

        /**
         * When completion is made, this plugin passes non-empty fields of the record to the LLM model for record context understanding.
         */
        recordContext?: {
          /**
           * Using this field you can limit number of fields passed to the model. 
           * Default is 5. 
           * Completion field is not included in this limit.
           * Set to 0 to disable context passing at all.
           * If count of fields exceeds this number, longest fields will be selected.
           * If some of values will exceed maxFieldLength, it will be smartly truncated by splitting ito splitParts, taking their 
           * starting substring and joining back with '...'.
           */
          maxFields?: number;

          /**
           * Limit of input field value. Default is 300. If field is longer, it will be truncated.
           */
          maxFieldLength?: number;

          /**
           * How many parts to split field value if it exceeds maxFieldLength. Default is 5.
           */
          splitParts?: number;

        }
    }

    /**
     * Since AI generation can be expensive, we can limit the number of requests per IP.
     * Completion will simply stop working when limit is reached so user will not be bothered with error messages.
     */
    rateLimit?: {

      /**
       * E.g. 5/1d - 5 requests per day
       * 3/1h - 3 requests per hour
       */ 
      limit: string,

      /**
       * Not used now
       * Message shown to user when rate limit is reached
       */
      errorMessage: string,
    },

  }

  /**
   * Allows to attach images to the HTML text
   * Requires to have a separate resource with Upload Plugin installed on attachment field.
   * Each attachment used in HTML will create one record in the attachment resource.
   */
  attachments?: {
    /**
     * Resource name where images are stored. Should point to the existing resource.
     */
    attachmentResource: string;

    /**
     * Field name in the attachment resource where image is stored. Should point to the existing field in the attachment resource.
     * Also there should be upload plugin installed on this field.
     */
    attachmentFieldName: string; // e.g. 'image_path',

    /**
     * When attachment is created, it will be linked to the record, by storing id of the record with editor in attachment resource.
     * Here you define the field name where this id will be stored.
     * 
     * Linking is needed to remove all attachments when record is deleted.
     * 
     * For example when RichEditor installed on description field of apartment resource,
     * field in attachment resource described hear will store id of apartment record.
     */
    attachmentRecordIdFieldName: string; // e.g. 'apartment_id',

    /**
     * When attachment is created, it will be linked to the resource, by storing id of the resource with editor in attachment resource.
     * For example when RichEditor installed on description field of apartment resource, it will store id of apartment resource.
     */
    attachmentResourceIdFieldName: string; // e.g. 'apartment_resource_id',
  },
}

