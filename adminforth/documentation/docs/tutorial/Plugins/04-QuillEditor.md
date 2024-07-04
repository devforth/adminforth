
> 🫸This plugin is under development and not yet released

# Quill editor

Quill is a free, open source WYSIWYG editor built for the modern web.

This plugin allows you to use Quill editor in your AdminForth application.

## Usage

Import plugin:

```ts title="./index.ts"
import QuillEditorPlugin from 'adminforth/plugins/QuillEditorPlugin';
```

Now instantiate the plugin and add it to the configuration:

```ts title="./index.ts"
{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'description',
      type: AdminForthDataTypes.RICHTEXT, // like plain AdminForthDataTypes.TEXT but renders HTML in show/list views
      ...
    }
    ...
  ],
  ...
  plugins: [
    ...
//diff-add
    new QuillEditorPlugin({
//diff-add
      htmlField: 'description',
//diff-add
    }),
    ...
  ],
}
```

Now you can see Quill editor in the `description` field in the edit view:

< screenshot >

# Multiple editors in one resource

If you need multiple fields in one resource which happens rarely, just add multiple instances of the plugin:

```ts
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