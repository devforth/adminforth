import { CompletionAdapter } from "adminforth";

export interface PluginOptions {
  /**
   * Field where plugin will auto-complete text. Should be string or text field.
   */
  fieldName: string;

  /**
   * Expert settings
   */
  expert?: {
    /**
     * Maximum number of last characters which will be used for completion for target field. Default is 500.
     * Higher value will give better context but will cost more.
     */
    promptInputLimit?: number;

    /**
     * Debounce time in ms. Default is 300. Time after user stopped typing before request will be sent.
     */
    debounceTime?: number;

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
    };

    /**
     * Number of tokens to generate. Default is 50. 1 token ~= ¾ words
     */
    maxTokens?: number;

    /**
     * Stop tokens. Default is ['.']
     */
    stop?: string[];
  };

  /**
   * Since AI generation can be expensive, we can limit the number of requests per IP.
   * Completion will simply stop working when limit is reached so user will not be bothered with error messages.
   */
  rateLimit?: {
    /**
     * E.g. 5/1d - 5 requests per day
     * 3/1h - 3 requests per hour
     */
    limit: string;

    /**
     * Message shown to user when rate limit is reached
     */
    errorMessage: string;
  };

  /**
   * Adapter for completion
   */
  adapter: CompletionAdapter;
}
