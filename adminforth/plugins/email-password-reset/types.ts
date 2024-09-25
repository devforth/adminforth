export interface PluginOptions {

  emailProvider: 'AWS_SES' ;

  /**
   * Field name in auth resource which contains email
   */
  emailField: string;

  /**
   * From which email to send password reset emails
   * e.g. no-reply@example.com
   * Example.com must be allowed in provider to send emails
   */
  sendFrom: string;

  providerOptions: {
    AWS_SES: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    }
  }
  
  passwordConstraints?: {
    /**
     * by default, password must be at least 8 characters long
     */ 
    minLength?: number;
  }
}