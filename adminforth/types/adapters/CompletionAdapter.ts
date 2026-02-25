export interface CompletionAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readbale error if the configuration is invalid.
   */
  validate(): void;

  /**
   * This method should return a text completion based on the provided content and stop sequence.
   * @param content - The input text to complete
   * @param stop - An array of stop sequences to indicate where to stop the completion
   * @param maxTokens - The maximum number of tokens to generate
   * @returns A promise that resolves to an object containing the completed text and other metadata
   */
  complete(
    content: string,
    stop: string[],
    maxTokens: number,
    outputSchema?: any
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