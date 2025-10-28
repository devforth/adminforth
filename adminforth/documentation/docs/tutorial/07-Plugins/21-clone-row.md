# Clone row

Allows to create a copy of record quickly, by substituting default values to create form


## Instalation

To install the plugin:

```bash
npm install @adminforth/clone-row --save
```

## Setting up

To setup the plugin just add it to your resource:

```ts .title="./resources/apartments.ts"
import CloneRow from "@adminforth/CloneRow";

    ...

plugins: [
    
    ...
//diff-add
    new CloneRow({}),
    ...

]
```

