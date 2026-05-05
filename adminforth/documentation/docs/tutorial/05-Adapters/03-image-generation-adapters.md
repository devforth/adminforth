---
description: "Reference page for AdminForth image generation adapters, including OpenAI and Gemini integrations used by plugins that create images from prompts."
---

# Image Generation Adapters

Used for image-generating AI tools.

[ImageGenerationAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/ImageGenerationAdapter.ts#L32)

## OpenAI Image Generation Adapter

```bash
pnpm i @adminforth/image-generation-adapter-openai
```

Uses OpenAI image generation models such as DALL·E, `gpt-image-1`, and `gpt-image-1.5` to generate images from text prompts.

Up to the winter 2026 OpenAI models are one of the most powerful image generation models available, especially GPT-Image-1.5, which is why we started with them.

## Gemini (Nano Banana) Image Generation Adapter

```bash
pnpm i @adminforth/image-generation-adapter-nano-banana
```

Uses the latest `gemini-3.1-flash-image-preview` model for instant image generation with text descriptions.

This model is the top of the Nano Banana line as of 2026, combining the speed of the Flash series with the improved detail of version 3.1. The adapter lets you integrate the advanced capabilities of previous models into your interface and generate precise visuals even for specific or complex prompts.