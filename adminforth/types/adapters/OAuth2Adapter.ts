
/**
 * This interface is used to implement OAuth2 authentication adapters.
 */
export interface OAuth2UserInfo {
  email?: string;
  provider?: string;
  subject?: string;
  phone?: string;
  meta?: Record<string, any>;
  fullName?: string;
  profilePictureUrl?: string | null;
  externalUserId?: string | number | null;
}

export interface OAuth2Adapter {
  /**
   * This method should return navigatable URL to the OAuth2 provider authentication page.
   */
  getAuthUrl(): string;

  /**
   * This method should return the user info from the OAuth2 provider using the provided code and redirect URI.
   * @param code - The authorization code received from the OAuth2 provider
   * @param redirect_uri - The redirect URI used in the authentication request
   * @returns A promise that resolves to OAuth2 user info
   */
  getTokenFromCode(code: string, redirect_uri: string): Promise<OAuth2UserInfo>;

  /**
   * This method should return text (content) of SVG icon which will be used in the UI.
   * Use official SVG icons with simplest possible conent, omit icons which have base64 encoded raster images inside.
   */
  getIcon(): string;

  /**
   * This method should return the text to be displayed on the button in the UI
   */
  getButtonText?(): string;

  /**
   * This method should return the name of the adapter
   */
  getName?(): string;
}
