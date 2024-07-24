export interface PluginOptions {
  /**
   * Field where plugin will auto-complete text. Should be string or text field.
   */
  fieldName: string;

  /**
   * OpenAI API key. Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key
   * Paste value in your .env file OPENAI_API_KEY=your_key
   * Set openAiApiKey: process.env.OPENAI_API_KEY to access it
   */
  openAiApiKey: string;

  /**
   * Model name. Go to https://platform.openai.com/docs/models, select model and copy name.
   * Default is `gpt-3.5-turbo`. Use e.g. more expensive `gpt-4o` for more powerful model.
   */
  model?: string;

  /**
   * Expert settings
   */
  expert?: {

    /**
     * Number of tokens to generate. Default is 50. 1 token ~= ¾ words 
     */
    maxTokens?: number;

    /**
     * Temperature (0-1). Lower is more deterministic, higher is more unpredicted creative. Default is 0.7.
     */
    temperature?: number;

    /**
     * Maximum number of last characters which will be used for completion. Default is 500.
     * Higher value will give better context but will cost more.
     */
    promptLimit?: number;

    /**
     * Debounce time in ms. Default is 300. Time after user stopped typing before request will be sent.
     */
    debounceTime?: number;

    /**
     * Stop tokens. Default is ['.']
     */
    stop?: string[];
  },

}