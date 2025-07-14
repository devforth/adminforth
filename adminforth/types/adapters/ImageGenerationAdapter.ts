export interface ImageGenerationAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readbale error if the configuration is invalid.
   */
  validate(): void;

  /**
   * Return max number of images which model can generate in one request
   */
  outputImagesMaxCountSupported(): number;

  /**
   * Return the list of supported dimensions in format ["100x500", "200x200"]
   */
  outputDimensionsSupported(): string[];

  /**
   * Input file extension supported
   */
  inputFileExtensionSupported(): string[];

  /**
   * This method should generate an image based on the provided prompt and input files.
   * @param prompt - The prompt to generate the image
   * @param inputFiles - An array of input file paths (optional)
   * @param n - The number of images to generate (default is 1)
   * @param size - The size of the generated image (default is the lowest dimension supported)
   * @returns A promise that resolves to an object containing the generated image URLs and any error message
   */
  generate({
    prompt, 
    inputFiles,
    n,
    size,
  }: {
    prompt: string,
    inputFiles: string[],

    // default = lowest dimension supported 
    size?: string,

    // one by default
    n?: number
  }): Promise<{
    imageURLs?: string[];
    error?: string;
  }>;
}
