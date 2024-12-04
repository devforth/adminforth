export interface EmailAdapter {
  sendEmail(
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  );
}
