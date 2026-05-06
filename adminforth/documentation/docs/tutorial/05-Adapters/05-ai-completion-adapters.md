---
description: "Reference page for AdminForth AI completion adapters, including the shared completion interface, structured output, streaming, reasoning events, and provider-specific setup."
---

# AI Completion Adapters

Used for AI-powered text completion.

[CompletionAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/CompletionAdapter.ts#L16)

Feel free to fork and implement other models, including Anthropic, Google Gemini, or any other AI model that supports text completion.

## Common `complete()` signature

All completion adapters implement the same `complete()` method signature from the shared `CompletionAdapter` interface.

```ts
complete({
  content: string,
  maxTokens: number,
  outputSchema?: any,
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh',
  tools?: CompletionTool[],
  onChunk?: (
    chunk: string,
    event?: {
      type: 'output' | 'reasoning';
      delta: string;
      text: string;
      source?: 'summary' | 'text';
    },
  ) => void | Promise<void>,
})
```

`reasoningEffort` is optional and defaults to `low` in the adapter implementation.

## Using `json_schema`

All completion adapters accept structured output through the shared `outputSchema` field in the request object. The example below uses the OpenAI adapter, but the same request shape is common for all completion adapters.

```ts
const adapter = new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  model: 'gpt-5-mini',
});

const prompt = 'What is the capital of France? return json';

adapter.complete({
  content: prompt,
  maxTokens: 200,
  outputSchema: {
    name: 'capital_response',
    schema: {
      type: 'object',
      properties: {
        capital: { type: 'string' },
      },
      required: ['capital'],
    },
  },
}).then((resp) => {
  console.log(resp);
});
```


## Using streaming output and reasoning events

All completion adapters accept `onChunk` inside the request object. The example below uses the OpenAI adapter, but the callback signature is common for all completion adapters.

Streaming reasoning events depend on the selected model and provider response.

```ts
const adapter = new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  model: 'gpt-5-mini',
});

await adapter.complete({
  content: 'Think step by step and write a short answer about how ABS brakes work',
  maxTokens: 300,
  reasoningEffort: 'medium',
  onChunk: async (chunk, event) => {
    if (!event) return;

    if (event.type === 'reasoning') {
      console.log('Reasoning chunk:', event.delta);
      return;
    }

    console.log('Output chunk:', event.delta);
  },
});
```

Then output will be like:

```ts
{ content: '{"capital":"Paris"}', finishReason: 'stop' }
```


## OpenAI Responses Completion Adapter

```bash
pnpm i @adminforth/completion-adapter-openai-responses
```

Integrates AdminForth with OpenAI's Responses API to provide AI-powered completion and conversational features.

The older `@adminforth/completion-adapter-open-ai-chat-gpt` package is deprecated. Use this package instead.

```ts
import CompletionAdapterOpenAIResponses from '@adminforth/completion-adapter-openai-responses';

new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  model: 'gpt-5.2',
  extraRequestBodyParameters: {
    temperature: 0.7,
    reasoning: {
      effort: 'medium',
    },
  },
}),
```

You can specify any GPT model you need. The default is `gpt-5-nano`.

This adapter uses the OpenAI `responses` API.

OpenAI-compatible providers can use the same adapter by setting `baseUrl`:

```ts
new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN as string,
  baseUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
  model: 'gpt-oss-20b',
  useComplitionApi: true,
  extraRequestBodyParameters: {
    store: false,
  },
}),
```

For LangChain agent mode, `useComplitionApi` controls which provider API is used:

- `false` uses the OpenAI `responses` API
- `true` uses the Chat Completions API

If `useComplitionApi` is omitted, the adapter keeps the current default behavior:

- official OpenAI uses the `responses` API
- custom `baseUrl` providers use the Chat Completions API

OVH AI Endpoints still does not fully support the `responses` API, so `useComplitionApi: false` may work unstably there.



## Google Gemini Completion Adapter

```bash
pnpm i @adminforth/completion-adapter-google-gemini
```

Integrates AdminForth with Google Gemini models to provide AI-powered completion and conversational features.

```ts
import CompletionAdapterGoogleGemini from '@adminforth/completion-adapter-google-gemini';

new CompletionAdapterGoogleGemini({
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  model: 'gemini-3-pro-preview',
  extraRequestBodyParameters: {
    temperature: 0.7,
  },
}),
```

You can specify any Gemini model you need. The default is `gemini-3-flash-preview`.

## Adding extra request body params

There might be cases where you want to add extra body params to the request sent to the AI provider. For those cases you can use `extraRequestBodyParameters`:

```ts
import CompletionAdapterGoogleGemini from '@adminforth/completion-adapter-google-gemini';

new CompletionAdapterGoogleGemini({
  geminiApiKey: process.env.GEMINI_API_KEY as string,
  model: 'gemini-3-pro-preview',
  extraRequestBodyParameters: {
    temperature: 0.7,
    responseMimeType: 'application/json',
  },
}),
```
