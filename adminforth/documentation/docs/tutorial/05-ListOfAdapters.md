# AdminForth Adapters

> Overview of all available adapters in the AdminForth ecosystem. Adapters enable integration with external services for features like authentication, email delivery, AI completion, image generation, and file storage.

---

## [📧 Email Adapters](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/EmailAdapter.ts#L17)

>Is used to send emails

### `adminforth-email-adapter-aws-ses`

Enables email delivery via [Amazon Simple Email Service (SES)](https://aws.amazon.com/ses/), suitable for high-volume, programmatic email sending.

### `adminforth-email-adapter-mailgun`

Allows sending transactional or marketing emails using [Mailgun](https://www.mailgun.com/), a developer-friendly email service.

---

## [🔐 OAuth Adapters](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/OAuth2Adapter.ts#L9)

>Is used for integrating third-party login providers using the OAuth 2.0 protocol.

### `adminforth-google-oauth-adapter`

Supports Google sign-in to allow users to authenticate using their Google accounts.

### `adminforth-github-oauth-adapter`

Enables authentication via GitHub accounts, useful for developer tools and open-source apps.

### `adminforth-facebook-oauth-adapter`

Allows users to log in with Facebook credentials.

### `adminforth-keycloak-oauth-adapter`

Connects AdminForth to a [Keycloak](https://www.keycloak.org/) identity provider for enterprise-grade SSO (Single Sign-On).

### `adminforth-microsoft-oauth-adapter`

Supports login through Microsoft accounts including Azure AD, Office365, and Outlook.com.

### `adminforth-twitch-oauth-adapter`

Adds support for Twitch authentication, useful for streaming or creator-oriented platforms.

---

## [🎨 Image Generation Adapters](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/ImageGenerationAdapter.ts#L32)
>Is used for image generating

### `adminforth-image-generation-adapter-openai`

Uses OpenAI’s image models (like DALL·E) to generate images from text prompts.

---

## [💾 Storage Adapters](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/StorageAdapter.ts#L8)
>Is used for storing files  
### `adminforth-storage-adapter-amazon-s3`

Stores uploaded files in [Amazon S3](https://aws.amazon.com/s3/), providing scalable cloud storage.

### `adminforth-storage-adapter-local`

Stores files locally on the server’s filesystem. Suitable for development or small-scale self-hosted setups.

---

## [🧠 AI Completion Adapters](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/CompletionAdapter.ts#L16)
>Is used for AI-powered sentence completion
### `adminforth-completion-adapter-open-ai-chat-gpt`

Integrates AdminForth with OpenAI’s ChatGPT models to provide AI-powered completion and conversational features.

---