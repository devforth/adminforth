export interface PluginOptions {

  /**
   * Field name in auth resource which contains email
   */
  emailField: string;

  /**
   * To work properly, this plugin requires a virtual password field in auth resource,
   * which will define any constraints which determine the password strength (regex, minLength).
   * When user will enter passowrd, it will be validated against this field constraints
   * If you don't need it in backoffice itself, you can add it and set showIn = []
   */
  passwordField: string;

  /**
   * Non-virtual field name in auth resource which contains password hash
   */
  passwordHashField: string;

  /**
   * Attributes which will be assigned to user by default
   * e.g. can be used to set default role
   */
  defaultAttributes?: {
    [key: string]: any;
  }




  /**
   * If not set user will not be asked for email confirmation (might be dangerous)
   */
  confirmEmails?: { 

    /**
     * A boolean field in auth resource which will be set to true when email is confirmed.
     * Must have boolean type.
     */
    emailConfirmedField: string;

    /**
     * Required to confirm email
     */
    emailProvider: 'AWS_SES' ;

    /**
     * From which email to send password reset emails
     * e.g. no-reply@example.com
     * Example.com must be allowed in provider to send emails
     */
    sendFrom: string;

    /**
     * Options for email provider
     */
    providerOptions: {
      AWS_SES: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
      }
    }
  }
  

}