/**
 * Interface for Captcha adapters.
 */

export interface CaptchaAdapter {
    /**
     * Returns the script source URL for the captcha widget.
     */
    getScriptSrc(): string;

    /**
     * Returns the site key for the captcha.
     */
    getSiteKey(): string;

    /**
     * Returns the widget ID for the captcha.
     */
    getWidgetId(): string;

    /**
     * Returns the token for the captcha.
     */
    getToken(): Promise<string> | string;

    /**
     * Sets the token for the captcha.
     */
    setToken(token: string): void;

    /**
     * Returns the script HTML for the captcha widget.
     */
    getRenderWidgetCode(): string;

    /**
     * Returns the function name to render the captcha widget.
     */
    getRenderWidgetFunctionName(): string;
    /**
     * Validates the captcha token.
     */
    validate(token: string, ip: string): Promise<Record<string, any>>;
}
