import type { JSONSchemaType } from "ajv";

export type CompletionStreamEvent = {
  type: "output" | "reasoning";
  delta: string;
  text: string;
  source?: "summary" | "text";
};

export type CompletionTool<Input = Record<string, any>, Output = any> = {
  name: string;
  input_schema: JSONSchemaType<Input>;
  description?: string;
  handler: (input: Input) => Promise<Output> | Output;
};
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
   * @param reasoningEffort - Optional parameter to indicate the level of reasoning effort for the completion
   * @param onChunk - Optional callback invoked for each streamed chunk or reasoning event
   * @returns A promise that resolves to an object containing the completed text and other metadata
   */
  complete(
    content: string,
    maxTokens: number,
    outputSchema?: any,
    reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh',
    tools?: CompletionTool[],
    onChunk?: (
      chunk: string,
      event?: CompletionStreamEvent,
    ) => void | Promise<void>,
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
