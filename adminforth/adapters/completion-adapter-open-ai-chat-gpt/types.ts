export interface AdapterOptions {
  /**
   * OpenAI API key. Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key
   * Paste value in your .env file OPENAI_API_KEY=your_key
   * Set openAiApiKey: process.env.OPENAI_API_KEY to access it
   */
  openAiApiKey: string;

  /**
   * Model name. Go to https://platform.openai.com/docs/models, select model and copy name.
   * Default is `gpt-4o-mini`. Use e.g. more expensive `gpt-4o` for more powerful model.
   */
  model?: string;

  /**
   * Expert settings
   */
  expert?: {
    /**
     * Temperature (0-1). Lower is more deterministic, higher is more unpredicted creative. Default is 0.7.
     */
    temperature?: number;
  };
}
