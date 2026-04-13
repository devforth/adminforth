export interface CompletionAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readbale error if the configuration is invalid.
   */
  validate(): void;

  /**
   * This method should return a text completion based on the provided content.
   * @param content - The input text to complete
   * @param maxTokens - The maximum number of tokens to generate
   * @param outputSchema - Optional structured output schema for the response
   * @param onChunk - Optional callback invoked for each streamed chunk
   * @returns A promise that resolves to an object containing the completed text and other metadata
   */
  complete(
    content: string,
    maxTokens: number,
    outputSchema?: any,
    onChunk?: (chunk: string) => void | Promise<void>,
  ): Promise<{
    content?: string;
    finishReason?: string;
    error?: string;
  }>;

  /**
   * This method should return the number of tokens in the input content.
   * @param content - The input text for which to measure the token count
   * @returns The number of tokens in the input content
   */
  measureTokensCount(content: string): Promise<number> | number;
}
