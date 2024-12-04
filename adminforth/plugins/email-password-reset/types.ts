import type { EmailAdapter } from "adminforth";

export interface PluginOptions {
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

  adapter: EmailAdapter;

  /**
   * To work properly, this plugin requires a virtual password field in auth resource.
   * If you don't need it, you can add it and set showIn = []
   * which will define any constraints which determine the password strength (regex, minLength).
   * When user will enter passowrd, it will be validated against this field constraints
   */
  passwordField: string;
}
