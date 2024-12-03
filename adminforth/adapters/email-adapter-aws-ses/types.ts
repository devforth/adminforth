/**
 * Options for configuring the AWS SES email adapter plugin.
 *
 * @interface AdapterOptions
 * @property {string} region - The AWS region where the SES service is hosted.
 * @property {string} accessKeyId - The access key ID for authenticating with AWS.
 * @property {string} secretAccessKey - The secret access key for authenticating with AWS.
 */
export interface AdapterOptions {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}
