---
title: List In-Place Edit
description: "Guide to the List In-Place Edit plugin, which makes selected list fields editable directly in the table without opening the edit page."
slug: /tutorial/Plugins/list-in-place-edit
---

# List in place edit

The List in Place Edit plugin allows you to edit records directly in the list view.

## Usage

First, install the plugin:

```bash
pnpm i @adminforth/list-in-place-edit --save
```

Import plugin:

```ts title="./resources/apartments.ts"
import ListInPlaceEditPlugin from "@adminforth/list-in-place-edit";
```

Now instantiate the plugin and add it to the configuration:

```ts title="./resources/apartments.ts"

{
  ...
  plugins: [
    new ListInPlaceEditPlugin({
      columns: ["title", "description"],
    }),
  ],
}
```

Here is how it looks:

![alt text](list-in-place.png)
