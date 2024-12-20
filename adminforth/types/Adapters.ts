export interface EmailAdapter {
  validate()

  sendEmail(
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  );
}

export interface CompletionAdapter {

  validate();

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
