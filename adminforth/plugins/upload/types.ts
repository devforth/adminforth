
export type PluginOptions = {

  /**
   * The name of the column where the path to the uploaded file is stored.
   * On place of this column, a file upload field will be shown.
   */
  pathColumnName: string;

  /**
   * the list of allowed file extensions
   */
  allowedFileExtensions?: string[]; // allowed file extensions

  /**
   * the maximum file size in bytes
   */
  maxFileSize?: number;

  /**
   * S3 bucket name where we will upload the files, e.g. 'my-bucket'
   */
  s3Bucket: string,

  /**
   * S3 region, e.g. 'us-east-1'
   */
  s3Region: string,

  /**
   * S3 access key id
   */
  s3AccessKeyId: string,

  /**
   * S3 secret access key
   */
  s3SecretAccessKey: string,

  /**
   * ACL which will be set to uploaded file, e.g. 'public-read'.
   * If you want to use 'public-read', it is your responsibility to set the "ACL Enabled" to true in the S3 bucket policy and Uncheck "Block all public access" in the bucket settings.
   */
  s3ACL?: string,

  /**
   * The path where the file will be uploaded to the S3 bucket, same path will be stored in the database
   * in the column specified in {@link pathColumnName}
   * 
   * example:
   * 
   * ```typescript
   * s3Path: ({originalFilename}) => `/aparts/${originalFilename}`
   * ```
   * 
   */
  s3Path: ({originalFilename, originalExtension, contentType, record }: {
    originalFilename: string,
    originalExtension: string,
    contentType: string,
    record?: any,
  }) => string,


  preview: {

    /**
     * Whether to show preview of image instead of path in list field
     * By default true
     */
    showInList?: boolean,

    /**
     * Whether to show preview of image instead of path in list field
     * By default true
     */
    showInShow?: boolean,

    /**
     * Maximum width of the preview image
     */
    maxWidth?: string,

    /**
     * Used to display preview (if it is image) in list and show views.
     * Defaulted to the AWS S3 presigned URL if resource is private or public URL if resource is public.
     * Can be used to generate custom e.g. CDN(e.g. Cloudflare) URL to worm up cache and deliver preview faster.
     * 
     * Example:
     * 
     * ```typescript
     * previewUrl: ({record, path}) => `https://my-bucket.s3.amazonaws.com/${path}`,
     * ```
     * 
     */ 
    previewUrl?: ({s3Path}) => string,
  }


  /**
   * AI image generation options
   */
  generation?: {
    /**
     * The provider to use for image generation
     * for now only 'openai-dall-e' is supported
     */
    provider: string,

    /**
     * The number of images to generate
     * in one request
     */
    countToGenerate: number,

    /**
     * Options for OpenAI
     */
    openAiOptions: {
      /**
       * The model to use, e.g. 'dall-e-3'
       */
      model: string,

      /**
       * The size of the image to generate, e.g. '1792x1024'
       */
      size: string,

      /**
       * The OpenAI API key
       */
      apiKey: string,
    },

    /**
     * Fields of record to use for context. if supplied must be array of valid column names for resource
     * where plugin is used.
     */
    fieldsForContext? : string[],

    
    /**
     * Since AI generation can be expensive, we can limit the number of requests per IP.
     */
    rateLimit?: {

      /**
       * E.g. 5/1d - 5 requests per day
       * 3/1h - 3 requests per hour
       */ 
      limit: string,

      /**
       * !Not used now
       * Message shown to user when rate limit is reached
       */
      errorMessage: string,
    },
  }

}