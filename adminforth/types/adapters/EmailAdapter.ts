export interface EmailAdapter {

  /**
   * This method is called to validate the configuration of the adapter
   * and should throw a clear user-readable error if the configuration is invalid.
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
