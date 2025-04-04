export interface EmailAdapter {
  validate(): Promise<void>;

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
  getTokenFromCode(code: string, redirect_uri: string): Promise<{ email: string }>;
  getIcon(): string;
  getButtonText?(): string;
  getName?(): string;
}
