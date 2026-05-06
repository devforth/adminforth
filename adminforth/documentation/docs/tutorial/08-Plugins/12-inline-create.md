---
title: Inline Create
description: "Guide to the Inline Create plugin, which lets users create records directly from the list page and configure which resources use the inline form."
slug: /tutorial/Plugins/inline-create
---

# Inline Create

The Inline Create plugin enables inline create in AdminForth, allowing users to create records directly in the list view.

## Installation

To install the plugin:

```bash
pnpm install @adminforth/inline-create --save
```


### Usage

Configure the plugin in your apartments resource file:

```typescript title="./resources/apartments.ts"
import InlineCreatePlugin from '@adminforth/inline-create';

// ... existing resource configuration ...

plugins: [
  new InlineCreatePlugin({}),
]
```

Here is how it looks:


![alt text](localhost_3000_resource_providers.png)