# Plugin development guide

Creating a plugin is a powerful way to extend AdminForth functionality.

## Concepts

Every plugin is installed to resource. 

Main concept is pretty simple: every plugin simply does modification of AdminForth config which developer passed on AdminForth initialization. 

Plugin can modify only config of resource where it is installed or whole global config.

To do modification plugin defines a method `modifyResourceConfig` which accepts `config` object. The `modifyResourceConfig` method called after first
config validation and preprocessing. After all plugins did modification, AdminForth calls validation and preprocessing again second time
to make sure all plugins did not screw up the config.

Also plugins can define custom components and custom APIs.

## Hello world plugin

Let's create plugin which auto-completes text in strings

```bash
mkdir -p af-plugin-chatgpt
cd af-plugin-chatgpt
npm init -y
touch index.ts
```

Edit `package.json`:

```json title='./af-plugin-chatgpt/package.json'
{
  ...
//diff-remove
  "main": "index.js",
//diff-add
  "main": "dist/index.js",
//diff-add
  "types": "dist/index.d.ts",
//diff-add
  "type": "module",
  "scripts": {
//diff-remove
    "test": "echo \"Error: no test specified\" && exit 1",
//diff-add
    "build": "tsc && cp -rf custom dist/",
  },
}
```


Install AdminForth for types and classes imports

```bash
npm i adminforth --save
```

Now create plugin boilerplate in `index.ts`:

```ts title='./af-plugin-chatgpt/index.ts'

import { AdminForthResourcePages, IAdminForth, IHttpServer, AdminForthPlugin, AdminForthResourceColumn  } from "adminforth";
import { PluginOptions } from './types.js';


export default class ChatGptPlugin extends AdminForthPlugin {
  options: PluginOptions;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
  
    // simply modify resourceConfig or adminforth.config. You can get access to plugin options via this.options;
  }
 

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/example`,
      handler: async ({ body }) => {
        const { name } = body;
        
        return {
          `Hello ${name}`,
        };
      }
    });
  }

}

```


Create `types.ts` file:

```ts title='./af-plugin-chatgpt/types.ts'

export interface PluginOptions {
  /**
   * Field where plugin will auto-complete text. Should be string or text field.
   */
  fieldName: string;

  /**
   * OpenAI API key. Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key
   * Paste value in your .env file
   * Set OPENAI_API_KEY: process.env.OPENAI_API_KEY to access it
   */
  OPENAI_API_KEY: string;

  /**
   * Model name. Go to https://platform.openai.com/docs/models, select model and copy name.
   * Default is `gpt-3.5-turbo`
   */
  model: string = 'gpt-3.5-turbo';

}
```


Create `./af-plugin-chatgpt/tsconfig.json` file:

```json title='./af-plugin-chatgpt/tsconfig.json'
{
  "compilerOptions": {
    "target": "es2016",                                  /* Set the JavaScript language version for emitted JavaScript and include*/ 
    "module": "node16",                                /* Specify what module code is generated. */
    "outDir": "./dist",                                   /* Specify an output folder for all emitted files. */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules.  */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */
    "strict": false,                                     /* Enable all strict type-checking options. */
    "skipLibCheck": true,                                 /* Skip type checking all .d.ts files. */
  },
  "exclude": ["node_modules", "dist", "custom"],           /* Exclude files from compilation. */
}

```
 


## Installation

in your app `index.ts` file:

```ts title='./index.ts'

import ChatGptPlugin from '../af-plugin-chatgpt/index.js';

...

{
  resourceId: 'aparts',
  ...
  plugins: [
    ...
    new ChatGptPlugin({
      openAiApiKey: process.env.OPENAI_API_KEY as string,
      fieldName: 'title',
    }),
  ]
}

```

Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key. Paste value in your .env file OPENAI_API_KEY=your_key

