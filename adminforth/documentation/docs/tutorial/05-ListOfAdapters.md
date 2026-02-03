# AdminForth Adapters

This page has a list of all available adapters in the AdminForth ecosystem. 
Adapters are used by AdminForth plugins to implement connections to various 3rd-party services and APIs. 
Every adapter could be easily forked and customized for any new service or API.

---

## 📧 Email Adapters

Used to send emails

[🔗Email adapter base class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/EmailAdapter.ts#L17)

### AWS SES Email Adapter

```
npm i @adminforth/email-adapter-aws-ses
```

Enables email delivery via [Amazon Simple Email Service (SES)](https://aws.amazon.com/ses/), suitable for high-volume, programmatic email sending.

### Mailgun Email Adapter

```
npm i @adminforth/email-adapter-mailgun
```

Allows sending transactional or marketing emails using [Mailgun](https://www.mailgun.com/), a developer-friendly email service.

---

## 🔐 OAuth2 Adapters

Used to authenticate users via OAuth 2.0 providers

[🔗OAuth2Adapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/OAuth2Adapter.ts#L9)


### Google OAuth Adapter

```
npm i @adminforth/google-oauth-adapter
```

Supports Google sign-in to allow users to authenticate using their Google or Google Workspaces accounts.

### GitHub OAuth Adapter

```
npm i @adminforth/github-oauth-adapter
```

Enables authentication via GitHub accounts, useful for developer tools and open-source apps.

### Facebook OAuth Adapter

```
npm i @adminforth/facebook-oauth-adapter
```

Allows users to log in with Facebook credentials. Facebook OAuth is commonly used for social media integrations.

### Keycloak OAuth Adapter

```
npm i @adminforth/keycloak-oauth-adapter
```

Connects AdminForth to an Open-Source [Keycloak](https://www.keycloak.org/) - generally self-hosted - identity provider for enterprise-grade SSO (Single Sign-On).

### Microsoft OAuth Adapter

```
npm i @adminforth/microsoft-oauth-adapter
```

Supports login through Microsoft accounts including Azure AD, Office365, and Outlook.com.

### Twitch OAuth Adapter

```
npm i @adminforth/twitch-oauth-adapter
```

Adds support for Twitch authentication, useful for streaming or creator-oriented platforms.

---

## 🎨 Image Generation Adapters

Is used for image generating AI tools.

[🔗ImageGenerationAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/ImageGenerationAdapter.ts#L32)


### OpenAI Image Generation Adapter

```
npm i @adminforth/image-generation-adapter-openai
```

Uses OpenAI’s image generation models (like DALL·E, gpt-image-1, gpt-image-1.5) to generate images from text prompts.

Up to the winter 2026 OpenAI models are one of the most powerful image generation models available (Especially GPT-Image-1.5), that is why we started with them.

---

## 💾 Storage Adapters


[🔗StorageAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/StorageAdapter.ts#L8)

Is used for storing files  

### Amazon S3 Storage Adapter

```
npm i @adminforth/storage-adapter-amazon-s3
```

Stores uploaded files in [Amazon S3](https://aws.amazon.com/s3/), providing scalable cloud storage.
Can be easily forked and customized to work with any S3-compatible storage service like MinIO or Wasabi or 3rd-party S3-capable services.


### Local Storage Adapter

```
npm i @adminforth/storage-adapter-local
```

Stores files locally on the server’s filesystem. Suitable for development or small-scale self-hosted setups.
Not really recommended for production use, cause cloud storage is more reliable and scalable.

---

## 🧠 AI Completion Adapters

[🔗CompletionAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/CompletionAdapter.ts#L16)


Is used for AI-powered text completion. 
Feel free to fork and implement other models including models from Anthropic, Google Gemini, or any other AI model that supports text completion.

### OpenAI Completion Adapter

```
npm i @adminforth/completion-adapter-open-ai-chat-gpt
```

Integrates AdminForth with OpenAI’s ChatGPT models to provide AI-powered completion and conversational features.

```ts
import CompletionAdapterOpenAIChatGPT from "@adminforth/completion-adapter-open-ai-chat-gpt";

new CompletionAdapterOpenAIChatGPT({
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  model: 'gpt-5.2',
  extraRequestBodyParameters: {
    temperature: 0.7
  }
}),

```
You can specify any gpt model you need. Default is `gpt-5-nano`

---

### Google Gemini Completion Adapter

```
npm i @adminforth/completion-adapter-google-gemini
```

Integrates AdminForth with Google Gemini models to provide AI-powered completion and conversational features.

```ts
import CompletionAdapterGoogleGemini from '@adminforth/completion-adapter-google-gemini';

new CompletionAdapterGoogleGemini({
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  model: "gemini-3-pro-preview",
  extraRequestBodyParameters: {
    temperature: 0.7
  }
}),
```

You can specify any gemini model you need. Default is `gemini-3-flash-preview`

### Adding extra request body params

There might be cases, whe you want to add extra body params in request, that sent to the AI provider. For those cases you can use `extraRequestBodyParameters`:


```ts
import CompletionAdapterGoogleGemini from '@adminforth/completion-adapter-google-gemini';

new CompletionAdapterGoogleGemini({
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  model: "gemini-3-pro-preview",
  extraRequestBodyParameters: {
    temperature: 0.7
  }
  //diff-add
  extraRequestBodyParameters: {
  //diff-add
    responseMimeType: "application/json",
  //diff-add
  }
}),
```


## 🔎 Image Analysis

[🔗ImageVisionAdapter source class](https://github.com/devforth/adminforth/blob/1efdc19e3bb7a5fc3b19106704e4ae8bb7c73276/adminforth/types/adapters/ImageVisionAdapter.ts#L1)

Used for AI-powered image analysis. These adapters can automatically analyze image content, extract text from images, identify objects, describe scenes, and provide detailed image insights. 

### OpenAI Vision Adapter

```
npm install @adminforth/image-vision-adapter-openai --save
```

Integrates AdminForth with OpenAI to provide advanced AI-powered image analysis. Can describe image content, read and extract text from images, identify objects and people, and provide detailed visual insights.

---

## 🗄️Key-value Adapters

[🔗Key-value adapter source class](https://github.com/devforth/adminforth/blob/86bb9236fed9e844fdb07688318c050641f9eb1c/adminforth/types/adapters/KeyValueAdapter.ts#L6)

Key-value adapters are used to store data in a key-value format. They provide a simple and efficient way to manage data where quick access to values based on unique keys is required.

### RAM Adapter

```
npm i @adminforth/key-value-adapter-ram
```

The RAM adapter is a simplest in-memory key-value storage. Stores data in process RAM memory. Not sutable if you run application with several processes because each process will have own RAM. In last case you need centralized KV adapter, e.g. Redis. 

Pros:
* Simplest in use - does not reqauire any external daemon.

Cones:
* In production sutable for single-process installations only


### Redis adapter

```bash
npm i @adminforth/key-value-adapter-redis
```

Redis adapter uses in-memory RAM-based Redis database with O(1) get complexity. It is great fit for most of lightweight tasks which fit in RAM. Also capable with multi-process or replica-based installations as centralized storage. Please note that Redis daemon might be not persisted to disk during restarts without additional settings, so if persistence is critical for your task - you might need to set up it separately (for many tasks like rate-limits ephemeral data are fine 


```ts
import RedisKeyValueAdapter from '@adminforth/key-value-adapter-redis';

const adapter = new RedisKeyValueAdapter({
  redisUrl: '127.0.0.1:6379'
})

adapeter.set('test-key', 'test-value', 120); //expiry in 120 seconds

```

### LevelDB adapter

```bash
npm i @adminforth/key-value-adapter-leveldb
```

LebelDB uses disk storage with o(log(n)) get complexity. Good fit for large and/or persistent KV datasets which still require fast KV access but don't efficently fit into RAM. Please not that this is a single-process adapter only, so if you will run severall processes of admin - they will not be able to work with this adapter (>=2 processes which look at same level database might lead to unpredicted behaviour - exceptions or crashes). 

You can use replicas with isolated disks, however in this case state will be also separated between replicas.

```ts
import LevelDBKeyValueAdapter from '@adminforth/key-value-adapter-leveldb'

const adapter = new LevelDBKeyValueAdapter({ 
  dbPath: './testdb' 
});

adapeter.set('test-key', 'test-value', 120); //expiry in 120 seconds

```

## 🤖Captcha adapters

Used to add capthca to the login screen

[🔗Captcha adapter source class](https://github.com/devforth/adminforth/blob/65153408a119314dad339f452700e0937952034a/adminforth/types/adapters/CaptchaAdapter.ts#L5)

### Cloudflare adapter

```
npm i @adminforth/login-captcha-adapter-cloudflare
```


### reCaptcha adapter

```
npm i @adminforth/login-captcha-adapter-recaptcha
```

