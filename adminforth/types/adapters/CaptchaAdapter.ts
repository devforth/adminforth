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
     * Renders the captcha widget HTML.
     */
    renderWidget(): void;

    /**
     * Validates the captcha token.
     */
    validate(token: string, ip: string): Promise<Record<string, any>>;
}