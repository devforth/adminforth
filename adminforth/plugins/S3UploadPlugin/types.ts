
export type PluginOptions = {

  /**
   * the name of the column where the path to the uploaded file is stored
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
   * This plugin creates a virtual column on edit and create views
   * where the user can upload a file. This is the label of that column
   * 
   * Defaulted to 'Upload <Name of the column defined in {@link pathColumnName}>'
   */
  uploadColumnLabel: string,

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
   * ACL which will be set to uploaded file, e.g. 'public-read'
   */
  s3ACL: string,

  /**
   * The path where the file will be uploaded to the S3 bucket, same path will be stored in the database
   * in the column specified in {@link pathColumnName}
   * 
   * example:
   * 
   * ```typescript
   * s3Path: ({record, originalFilename}) => `/aparts/${record.id}/${originalFilename}`
   * ```
   * 
   */
  s3Path: ({originalFilename, originalExtension, contentType}) => string,

  /**
   * Used to display preview (if it is image) in list and show views.
   * Defaulted to the AWS S3 presigned URL
   * Example:
   * 
   * ```typescript
   * previewUrl: ({record, path}) => `https://my-bucket.s3.amazonaws.com/${path}`,
   * ```
   * 
   */ 
  previewUrl?: ({s3Path}) => string,
}