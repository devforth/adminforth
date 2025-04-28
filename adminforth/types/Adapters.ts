export interface EmailAdapter {
  validate(): Promise<void>;

  sendEmail(
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  ): Promise<{
    error?: string;
    ok?: boolean;
  }>;
}

export interface CompletionAdapter {

  validate(): void;

  complete(
    content: string,
    stop: string[],
    maxTokens: number,
  ): Promise<{
    content?: string;
    finishReason?: string;
    error?: string;
  }>;
}

export interface ImageGenerationAdapter {

  validate(): void;

  /**
   * Return 1 or Infinity if the adapter supports multiple images
   */
  outputImagesCountSupported(): number;

  /**
   * Return the list of supported dimensions in format ["100x500", "200x200"]
   */
  outputDimensionsSupported(): string[];

  /**
   * Input file extension supported
   */
  inputFileExtensionSupported(prompt: string, inputFiles: string[]): string[];

  generate(
    prompt: string,
    inputFiles: string[],
  ): Promise<{
    imageURL?: string;
    error?: string;
  }>;
}



export interface OAuth2Adapter {
  getAuthUrl(): string;
  getTokenFromCode(code: string, redirect_uri: string): Promise<{ email: string }>;
  getIcon(): string;
  getButtonText?(): string;
  getName?(): string;
}
