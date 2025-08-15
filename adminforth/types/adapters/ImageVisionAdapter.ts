export interface ImageVisionAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readable error if the configuration is invalid.
   */
  validate(): void;

  /**
   * Input file extension supported
   */
  inputFileExtensionSupported(): string[];

  /**
   * This method should generate an image based on the provided prompt and input files.
   * @param prompt - The prompt to generate the image
   * @param inputFileUrls - An array of input file paths (optional)
   * @returns A promise that resolves to an object containing the generated image  and any error message
   */
  generate({
    prompt, 
    inputFileUrls,
  }: {
    prompt: string,
    fieldsToFill: Record<string, string>,
    inputFileUrls: string[],
  }): Promise<{
    response: string;
    error?: string;
  }>;
}
