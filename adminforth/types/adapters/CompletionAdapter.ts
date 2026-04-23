import type { JSONSchemaType } from "ajv";

export type CompletionStreamEvent = {
  type: "output" | "reasoning";
  delta: string;
  text: string;
  source?: "summary" | "text";
};

export type CompletionReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export type CompletionTool<Input = Record<string, any>, Output = any> = {
  name: string;
  input_schema: JSONSchemaType<Input>;
  description?: string;
  handler: (input: Input) => Promise<Output> | Output;
};

export type CompletionRequest = {
  content: string;
  maxTokens: number;
  outputSchema?: any;
  reasoningEffort?: CompletionReasoningEffort;
  tools?: CompletionTool[];
  onChunk?: (
    chunk: string,
    event?: CompletionStreamEvent,
  ) => void | Promise<void>;
};

export type CompletionAdapterLangChainAgentPurpose =
  | "primary"
  | "summary";

export type CompletionAdapterLangChainAgentSpec = {
  model: unknown;
  middleware?: unknown[];
};

export interface CompletionAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readbale error if the configuration is invalid.
   */
  validate(): void;

  /**
   * This method should return a text completion based on the provided content.
   * @param request - Completion request options
   * @returns A promise that resolves to an object containing the completed text and other metadata
   */
  complete(request: CompletionRequest): Promise<{
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

export interface LangChainAgentCompletionAdapter extends CompletionAdapter {
  getLangChainAgentSpec(params: {
    maxTokens: number;
    purpose: CompletionAdapterLangChainAgentPurpose;
  }): Promise<CompletionAdapterLangChainAgentSpec>
    | CompletionAdapterLangChainAgentSpec;
}
