# Text Complete

This plugin allows you to auto-complete text and string fields using OpenAI Chat GPT models.

## Installation

```
npm i @adminforth/text-complete --save
npm i @adminforth/completion-adapter-open-ai-chat-gpt --save
```

Go to https://platform.openai.com/, open `Dashboard` -> `API keys` -> `Create new secret key`. Paste value in your `.env` file:

```env title=.env
...
OPENAI_API_KEY=your_key
```

Add plugin installation to any text or string column.

For example let's add it for title and description in `aparts` resource configuration which we created in [Getting Started](../001-gettingStarted.md) tutorial.

```ts title="./resources/apartments.ts"
//diff-add
import TextCompletePlugin from '@adminforth/text-complete';
//diff-add
import CompletionAdapterOpenAIChatGPT from "@adminforth/completion-adapter-open-ai-chat-gpt";


export const admin = new AdminForth({
  ...
  resourceId: 'aparts',
  columns: [
    ...
  ],
  plugins: [
    ...
//diff-add
    new TextCompletePlugin({
//diff-add
      openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
      fieldName: 'title',
//diff-add
      adapter: new CompletionAdapterOpenAIChatGPT({
//diff-add
        openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
        model: 'gpt-4o', // default "gpt-4o-mini"
//diff-add
        expert: {
//diff-add
            temperature: 0.7 //Model temperature, default 0.7
//diff-add
        }
//diff-add
      }),
//diff-add
    }),
//diff-add
    new TextCompletePlugin({
//diff-add
      fieldName: 'description',
//diff-add
      adapter: new CompletionAdapterOpenAIChatGPT({
//diff-add
        openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
      }),
//diff-add
      // expert: {
//diff-add
        // maxTokens: 50, // token limit to generate for each completion. 50 is default
//diff-add
        // promptInputLimit: 500, // Limit in characters of edited field to be passed to Model. 500 is default value
//diff-add
        // debounceTime: 300, // Debounce time in milliseconds. 300 is default value
//diff-add
      // }
//diff-add
    }),

  ]

  ...

});
```

Here is how it looks:

!![alt text](dashboard_test2.gif)
