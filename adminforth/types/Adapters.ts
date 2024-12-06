export interface EmailAdapter {
  sendEmail(
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  );
}

export interface CompletionAdapter {
  complete(
    content: string,
    stop: string[],
    maxTokens: number
  ): Promise<{ content: string; finishReason: string }>;
}
