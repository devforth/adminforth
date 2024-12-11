# Rich editor

Under the hood this plugin uses [Quill](https://quilljs.com/). Quill is a free, open source WYSIWYG editor built for the modern web.

This plugin allows you to use Quill editor in your AdminForth application.

## Usage

First, install the plugin:

```bash
npm i @adminforth/rich-editor --save
```

Import plugin:

```ts title="./resources/apartments.ts"
import RichEditorPlugin from "@adminforth/rich-editor";
```

Now instantiate the plugin and add it to the configuration:

```ts title="./resources/apartments.ts"

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'description',
//diff-add
      type: AdminForthDataTypes.RICHTEXT, // like plain AdminForthDataTypes.TEXT but renders HTML in show/list views
      ...
    }
    ...
  ],
  ...
  plugins: [
    ...
//diff-add
    new RichEditorPlugin({
//diff-add
      htmlFieldName: 'description',
//diff-add
    }),
    ...
  ],
}
```

Now you can see Quill editor in the `description` field in the edit view:

![alt text](image-2.png)

# Multiple editors in one resource

If you need multiple fields in one resource which happens rarely, just add multiple instances of the plugin:

```ts title="./resources/apartments.ts"
{
  ...
  resourceId: 'promotion',
  columns: [
    ...
    {
      name: 'short_description',
      type: AdminForthDataTypes.RICHTEXT,
      ...
    },
    {
      name: 'full_description',
      type: AdminForthDataTypes.RICHTEXT,
      ...
    }
    ...
  ],
  ...
  plugins: [
    ...
    new QuillEditorPlugin({
      htmlField: 'short_description',
    }),
    new QuillEditorPlugin({
      htmlField: 'full_description',
    }),
    ...
  ],
}
```

## Completion

To get completion suggestions for the text in the editor, you can use the `completion` option. This option is an object with the following properties:

```ts title="./resources/apartments.ts"
//diff-add
  import CompletionAdapterOpenAIChatGPT from "@adminforth/completion-adapter-open-ai-chat-gpt";

  new RichEditorPlugin({
      htmlFieldName: 'description',
//diff-add
      completion: {
//diff-add
        adapter: new CompletionAdapterOpenAIChatGPT({
//diff-add
          openAiApiKey: process.env.OPENAI_API_KEY as string,
//diff-add
          model: 'gpt-4o', //gpt-4o-mini is a default (cheapest one)
          expert: {
//diff-add
            temperature: 0.7 //Model temperature, default 0.7
//diff-add
        }
//diff-add
        }),
//diff-add
        expert: {
//diff-add
          debounceTime: 250,
//diff-add
        }
//diff-add
      }
    }),
```

![alt text](gptDemo.gif)
