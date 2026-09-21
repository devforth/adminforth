---
description: "Reference page for AdminForth image generation adapters, including OpenAI and Gemini integrations used by plugins that create images from prompts."
---

# Image Generation Adapters

Used for image-generating AI tools.

## OpenAI Image Generation Adapter

```bash
pnpm add @adminforth/image-generation-adapter-openai
```

Uses OpenAI image generation model `gpt-image` to generate images from text prompts.

Up to the winter 2026 OpenAI models are one of the most powerful image generation models available, especially GPT-Image-1.5, which is why we started with them.

```ts
import ImageGenerationAdapterOpenAI from '@adminforth/image-generation-adapter-openai';

new ImageGenerationAdapterOpenAI({
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  model: 'gpt-image-1',
  extraParams: {
    quality: 'high',
  },
}),
```

## Gemini (Nano Banana) Image Generation Adapter

```bash
pnpm add @adminforth/image-generation-adapter-nano-banana
```

```ts
import ImageGenerationAdapterNanoBanana from '@adminforth/image-generation-adapter-nano-banana';

new ImageGenerationAdapterNanoBanana({
  nanoBananaApiKey: process.env.GEMINI_API_KEY as string,
  model: 'gemini-3.1-flash-image-preview',
  attachImagesAllowedHosts: ['my-bucket.s3.eu-central-1.amazonaws.com'],
}),
```

### Restricting input image hosts (SSRF protection)

To use input images, the adapter downloads every URL passed in `inputFiles` from your server. If those URLs can be influenced by a user (for example they are built from a record field which the user can edit, or come from `attachFiles` of a plugin), an attacker can point them at internal addresses like `http://169.254.169.254/latest/meta-data/` or `http://localhost:9200/` and use your backend as a proxy to your private network — a classic SSRF.

`attachImagesAllowedHosts` closes this hole: only listed hosts are downloaded, anything else throws before the request is made. Always set it to the storage you actually serve images from:

```ts
new ImageGenerationAdapterNanoBanana({
  nanoBananaApiKey: process.env.GEMINI_API_KEY as string,
//diff-add
  attachImagesAllowedHosts: ['my-bucket.s3.eu-central-1.amazonaws.com'],
}),
```

Matching is case-insensitive: `example.com` matches that host only, while `.example.com` (or `*.example.com`) matches it and all its subdomains.

> ⚠️ When `attachImagesAllowedHosts` is not set, images are downloaded from **any** host. Leave it unset only if the adapter never receives URLs which depend on user input.