export interface EmailAdapter {
  validate(): Promise<void>;

  sendEmail(
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  ): Promise<void>;
}

export interface CompletionAdapter {

  validate(): void;

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

export interface OAuth2Adapter {
  getAuthUrl(): string;
  getTokenFromCode(code: string): Promise<{ email: string }>;
  getIcon(): string;
}
