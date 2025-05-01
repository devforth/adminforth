export interface EmailAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readbale error if the configuration is invalid.
   */
  validate(): Promise<void>;

  /**
   * This method should send an email using the adapter
   * @param from - The sender's email address
   * @param to - The recipient's email address
   * @param text - The plain text version of the email
   * @param html - The HTML version of the email
   * @param subject - The subject of the email
   */
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
  ): Promise<{
    content?: string;
    finishReason?: string;
    error?: string;
  }>;
}

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


/**
 * This interface is used to implement OAuth2 authentication adapters.
 */
export interface OAuth2Adapter {
  /**
   * This method should return navigatable URL to the OAuth2 provider authentication page.
   */
  getAuthUrl(): string;

  /**
   * This method should return the token from the OAuth2 provider using the provided code and redirect URI.
   * @param code - The authorization code received from the OAuth2 provider
   * @param redirect_uri - The redirect URI used in the authentication request
   * @returns A promise that resolves to an object containing the email address of the authenticated user
   */
  getTokenFromCode(code: string, redirect_uri: string): Promise<{ email: string }>;

  /**
   * This method should return text (content) of SVG icon which will be used in the UI.
   * Use official SVG icons with simplest possible conent, omit icons which have base64 encoded raster images inside.
   */
  getIcon(): string;

  /**
   * This method should return the text to be displayed on the button in the UI
   */
  getButtonText?(): string;

  /**
   * This method should return the name of the adapter
   */
  getName?(): string;
}


export interface StorageAdapter {
  /**
   * This method should return the presigned URL for the given key capable of upload (PUT multipart form data to it).
   * The PUT method should fail if the file already exists.
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   * @param expiresIn - The expiration time in seconds for the presigned URL
   * @param contentType - The content type of the file to be uploaded
   */
  getUploadSignedUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;

  /**
   * This method should return the URL for the given key capable of download (200 GET request with response or 200 HEAD request without response).
   * If adapter configured to use public storage, this method should return the public URL of the file.
   * If adapter configured to use private storage, this method should return the presigned URL for the file.
   * 
   * @param key - The key of the file to be downloaded e.g. "uploads/file.txt"
   * @param expiresIn - The expiration time in seconds for the presigned URL
   */
  getDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * This method should mark the file for deletion.
   * If file is marked for delation and exists more then 24h (since creation date) it should be deleted.
   * This method should work even if the file does not exist yet (e.g. only presigned URL was generated).
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   */
  markKeyForDeletation(key: string): Promise<string>;


  /**
   * This method should mark the file to not be deleted.
   * This method should be used to cancel the deletion of the file if it was marked for deletion.
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   */
  markKeyForNotDeletation(key: string): Promise<string>;


  /**
   * This method can start needed schedullers, cron jobs, etc. to clean up the storage.
   */
  setupLifecycle(): Promise<void>;

}

  