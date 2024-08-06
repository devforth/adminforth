

# Chat-GPT

This plugin allows you to auto-complete text and string fields using OpenAI Chat GPT models.

## Installation

```
npm i @adminforth/chat-gpt --save
```

Go to https://platform.openai.com/, open `Dashboard` -> `API keys` -> `Create new secret key`. Paste value in your `.env` file:

```text title=.env
...
OPENAI_API_KEY=your_key
```


Add plugin installation to any text or string column. 

For example let's add it for title and description in `aparts` resource configuration which we created in [Getting Started](../01-gettingStarted.md) tutorial.

```ts title="./index.ts"
//diff-add
import ChatGptPlugin from '@adminforth/chat-gpt';


export const admin = new AdminForth({
  ...
  resourceId: 'aparts',
  columns: [
    ...
  ],
  plugins: [
    ...
//diff-add
    new ChatGptPlugin({
//diff-add
      openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
      fieldName: 'title',
//diff-add
    }),
//diff-add
    new ChatGptPlugin({
//diff-add
      openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
      fieldName: 'description',
//diff-add
      model: 'gpt-4o',
//diff-add
      // expert: {
//diff-add
        // maxTokens: 50, // token limit to generate for each completion. 50 is default
//diff-add
        // temperature: 0.7, // Model temperature, 0.7
//diff-add
        // promptLimit: 500, // Limit in characters of each field length to be passed to Model. 500 is default value
//diff-add
        // debounceTime: 300, // Debounce time in milliseconds. 300 is default value
//diff-add
      // }
//diff-add
    }),
//diff-add
  ]
  
  ...

});


Check all plugin options in the [API reference](https://adminforth.dev/docs/api/plugins/chat-gpt/types/interfaces/PluginOptions).
