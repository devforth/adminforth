---
title: Clone Row
description: "Guide to the Clone Row plugin, which opens the create flow with values copied from an existing record so users can duplicate rows quickly."
slug: /tutorial/Plugins/clone-row
---

# Clone row

Allows to create a copy of record quickly, by substituting default values to create form


## Instalation

To install the plugin:

```bash
pnpm install @adminforth/clone-row --save
```

## Setting up

To setup the plugin just add it to your resource:

```ts .title="./resources/apartments.ts"
import CloneRow from "@adminforth/clone-row";

    ...

plugins: [
    
    ...
//diff-add
    new CloneRow({}),
    ...

]
```

