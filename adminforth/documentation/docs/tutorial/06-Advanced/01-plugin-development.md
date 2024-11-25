# Plugin development guide

Creating a plugin is a powerful way to extend AdminForth functionality.

## Concepts

Every plugin is installed to resource.

Every plugin simply does modification of AdminForth config which developer passed on AdminForth initialization. 

Plugin can modify both config of resource where it is installed or whole global config.

To perform modification plugin defines a method `modifyResourceConfig` which accepts `config` object. The `modifyResourceConfig` method called after first config validation and preprocessing. 

Also plugins can define custom components and custom APIs.

## Boilerplate

Let's create plugin which auto-completes text in strings

```bash
mkdir -p af-plugin-chatgpt
cd af-plugin-chatgpt
npm init -y
touch index.ts
npm i --save-dev typescript @types/node
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
    "build": "tsc && rsync -av --exclude 'node_modules' custom dist/ && npm version patch"
  },
}
```


Install AdminForth for types and classes imports:

```bash
npm i adminforth --save
```

Now create plugin boilerplate in `index.ts`:

```ts title='./af-plugin-chatgpt/index.ts'

import { AdminForthPlugin } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthResourcePages, AdminForthResourceColumn, AdminForthDataTypes, AdminForthResource } from "adminforth";
import type { PluginOptions } from './types.js';


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
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/example`,
      handler: async ({ body }) => {
        const { name } = body;
        return { hey: `Hello ${name}` };
      }
    });
  }

}
```

Create `types.ts` file:

```ts title='./af-plugin-chatgpt/types.ts'

export interface PluginOptions {
  
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

This is very important step! (otherwise some features like method redefinition might blindly fail).

## Creating plugin logic

In previous section we created boilerplate which is a must for every plugin. 
Now let's implement plugin logic. 

First of all we want one plugin installation to be able to set custom Vue component on create and edit pages.

In plugin options we will pass field name and `OPENAI_API_KEY`.



```ts title='./af-plugin-chatgpt/types.ts'

export interface PluginOptions {

//diff-add
  /**
//diff-add
   * Field where plugin will auto-complete text. Should be string or text field.
//diff-add
   */
//diff-add
  fieldName: string;

//diff-add
  /**
//diff-add
   * OpenAI API key. Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key
//diff-add
   * Paste value in your .env file OPENAI_API_KEY=your_key
//diff-add
   * Set openAiApiKey: process.env.OPENAI_API_KEY to access it
//diff-add
   */
//diff-add
  openAiApiKey: string;

//diff-add
  /**
//diff-add
   * Model name. Go to https://platform.openai.com/docs/models, select model and copy name.
//diff-add
   * Default is `gpt-4o-mini`. Use e.g. more expensive `gpt-4o` for more powerful model.
//diff-add
   */
//diff-add
  model?: string;

//diff-add
  /**
//diff-add
   * Expert settings
//diff-add
   */
//diff-add
  expert?: {

//diff-add
    /**
//diff-add
     * Number of tokens to generate. Default is 50. 1 token ~= ¾ words 
//diff-add
     */
//diff-add
    maxTokens?: number;
//diff-add
  }


}
```

Now we have to create custom Vue component which will be used in plugin. To do it create custom folder:

```bash
mkdir -p af-plugin-chatgpt/custom
```

We will use `vue-suggestion-input` package in our frontend component. 
To install package into frontend component, first of all we have to initialize npm package in custom folder:

```bash
cd af-plugin-chatgpt/custom
npm init -y
```

Now install our dependency:

```bash
npm i --save-dev vue-suggestion-input 
```

Create file `completionInput.vue`:

```html title='./af-plugin-chatgpt/custom/completionInput.vue'
<template>
  <SuggestionInput 
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 
      focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
      dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 whitespace-normal"
      v-model="currentValue"
      :type="column.type"
      :completionRequest="complete"
      :debounceTime="meta.debounceTime"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, Ref  } from 'vue';
import { callAdminForthApi } from '@/utils';
import { AdminForthColumnCommon } from '@/types/Common';
import SuggestionInput from 'vue-suggestion-input';
import 'vue-suggestion-input/dist/style.css';

const props = defineProps<{
  column: AdminForthColumnCommon,
  record: any,
  meta: any,
}>();

const emit = defineEmits([
  'update:value',
]);

const currentValue: Ref<string> = ref('');

onMounted(() => {
  currentValue.value = props.record[props.column.name] || '';
});

watch(() => currentValue.value, (value) => {
  emit('update:value', value);
});

watch(() => props.record, (value) => {
  currentValue.value = value[props.column.name] || '';
});

async function complete(textBeforeCursor: string) {
  const res = await callAdminForthApi({
      path: `/plugin/${props.meta.pluginInstanceId}/doComplete`,
      method: 'POST',
      body: {
        record: {...props.record, [props.column.name]: textBeforeCursor},
      },
  });

  return res.completion;
}
</script>

```

As you can see we call API endpoint `/plugin/${props.meta.pluginInstanceId}/doComplete` to get completion. 

> For all your API calls from your own plugins we recommend to use same url format which includes pluginInstanceId. This way you can be sure that your API calls are unique for each plugin installation.


Let's define API endpoint in our plugin:


```ts title='./af-plugin-chatgpt/index.ts'
  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
//diff-remove
      path: `/plugin/${this.pluginInstanceId}/example`,
//diff-add
      path: `/plugin/${this.pluginInstanceId}/doComplete`,
      handler: async ({ body }) => {
//diff-remove
        const { name } = body;
//diff-remove
        return { hey: `Hello ${name}` };
//diff-add
        const { record } = body;
//diff-add
        let currentVal = record[this.options.fieldName];
//diff-add
        const promptLimit = 500;
//diff-add
        if (currentVal && currentVal.length > promptLimit) {
//diff-add
          currentVal = currentVal.slice(-promptLimit);
//diff-add
        }
//diff-add
        const resLabel = this.resourceConfig.label;
//diff-add
        let content;
//diff-add
        if (currentVal) {
//diff-add
          content = `Continue writing for text/string field "${this.options.fieldName}" in the table "${resLabel}"\n` +
//diff-add
              `Current field value: ${currentVal}\n` +
//diff-add
              "Don't talk to me. Just write text. No quotes. Don't repeat current field value, just write completion\n";
//diff-add
        } else {
//diff-add
          content = `Fill text/string field "${this.options.fieldName}" in the table "${resLabel}"\n` +
//diff-add
              "Be short, clear and precise. No quotes. Don't talk to me. Just write text\n";
//diff-add
        }
//diff-add
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//diff-add
          method: 'POST',
//diff-add
          headers: {
//diff-add
            'Content-Type': 'application/json',
//diff-add
            'Authorization': `Bearer ${this.options.openAiApiKey}`
//diff-add
          },
//diff-add
          body: JSON.stringify({
//diff-add
            model: this.options.model || 'gpt-4o-mini',
//diff-add
            messages: [{ role: 'user', content, }],
//diff-add
            temperature: 0.7,
//diff-add
            max_tokens: this.options.expert?.maxTokens || 50,
//diff-add
            stop: ['.'],
//diff-add
          })
//diff-add
        });
//diff-add
        const data = await resp.json();
//diff-add
        if (!data.choices) {
//diff-add
              throw new Error(`Wrong response from OpenAI ${JSON.stringify(data)}`)
//diff-add
        }
//diff-add
        let suggestion = data.choices[0].message.content + (
//diff-add
          data.choices[0].finish_reason === 'stop' ? (
//diff-add
            this.columnType === AdminForthDataTypes.TEXT ? '. ' : ''
//diff-add
          ) : ''
//diff-add
        );
//diff-add
        if (suggestion.startsWith(currentVal)) {
//diff-add
          suggestion = suggestion.slice(currentVal.length);
//diff-add
        }
//diff-add
        if (suggestion.startsWith(currentVal)) {
//diff-add
          suggestion = suggestion.slice(currentVal.length);
//diff-add
        }
//diff-add
        const wordsList = suggestion.split(' ').map((w, i) => {
//diff-add
          return (i === suggestion.split(' ').length - 1) ? w : w + ' ';
//diff-add
        });
//diff-add
        return { completion: wordsList };
//diff-add
      }
      })
    }
```

Now we have to set custom input on create and edit pages for field which user defined in fieldName:



```ts title='./af-plugin-chatgpt/index.ts'

export default class ChatGptPlugin extends AdminForthPlugin {
  options: PluginOptions;

//diff-add
  resourceConfig!: AdminForthResource;
//diff-add
  columnType!: AdminForthDataTypes;

  ...

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

//diff-add
    // ensure that column exists
//diff-add
    const column = resourceConfig.columns.find(f => f.name === this.options.fieldName);
//diff-add
    if (!column) {
//diff-add
      throw new Error(`Field ${this.options.fieldName} not found in resource ${resourceConfig.label}`);
//diff-add
    }
//diff-add
    if (!column.components) {
//diff-add
      column.components = {};
//diff-add
    }
//diff-add
    const filed = {
//diff-add
      file: this.componentPath('completionInput.vue'),
//diff-add
      meta: {
//diff-add
        pluginInstanceId: this.pluginInstanceId,
//diff-add
        fieldName: this.options.fieldName,
//diff-add
        debounceTime: 300,
//diff-add
      }
//diff-add
    }
//diff-add
    column.components.create = filed;
//diff-add
    column.components.edit = filed;
//diff-add
    this.columnType = column.type!;
  }

```

Additionally we should check that column type is string or text, otherwise our input will not work properly. 
From first sight we can make this validation in modifyResourceConfig method, but it is not good idea because we can't be sure that column type is
defined and known at this stage. If user defined it manually then it will be there, but if type is auto-discovered then it will be undefined at this stage.

That is why we will use `validateConfigAfterDiscover` method:

```ts title='./af-plugin-chatgpt/index.ts'
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
//diff-add
    const column = this.resourceConfig.columns.find(f => f.name === this.options.fieldName);
//diff-add
    if (![AdminForthDataTypes.STRING, AdminForthDataTypes.TEXT].includes(column!.type!)) {
//diff-add
      throw new Error(`Field ${this.options.fieldName} should be string or text type, but it is ${column!.type}`);
//diff-add
    }
//diff-add
    // any validation better to do here e.g. because bundleNow might no have enough environment
//diff-add
    if (!this.options.openAiApiKey) {
//diff-add
      throw new Error('OPENAI_API_KEY is required');
//diff-add
    }
  }
```

Finally, since we want to support multiple installations on one resource (e.g. one plugin installation for `title` field and another for `description` field), we have to define plugin instance unique representation. Best idea in this case to use field name which will be different for each installation:

```ts title='./af-plugin-chatgpt/index.ts'
  instanceUniqueRepresentation(pluginOptions: any) : string {
//diff-add
    return `${pluginOptions.fieldName}`;
//diff-remove
    return `single`;
  }
```


Ro compile plugin run:

```bash
npm run build
```

You can also publish your plugin to npm using `npm publish`.

## Installation of plugin

If you want to test your plugin locally before publishing, enter plugin dir and run:

```bash
cd af-plugin-chatgpt
npm link
```

Then enter your AdminForth project and run:

```bash
npm link af-plugin-chatgpt
```

Now  in your app `index.ts` file:

```ts title='./index.ts'

import ChatGptPlugin from 'af-plugin-chatgpt';

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
    new ChatGptPlugin({
      openAiApiKey: process.env.OPENAI_API_KEY as string,
      fieldName: 'description',
    }),
  ]
}

```

Go to https://platform.openai.com/, go to Dashboard -> API keys -> Create new secret key. Paste value in your `.env` file OPENAI_API_KEY=your_key

> ☝️ Using `npm link` approach still requires `npm run build` in plugin dir after each change because plugin entry point is defined as `dist/index.js` in
> `package.json` file. To speed up plugin development you can also don't use `npm link` and just import plugin main file from your demo file:
> ```
> import ChatGptPlugin from '<path to af plugin>/af-plugin-chatgpt/index.js';
> ```


> 🎓 Homework 1: Extend `expert` settings section to include next parameters: `temperature`, `promptLimit`, `debounceTime`,

> 🎓 Homework 2: Plugin does not pass record other values to Chat GPT which can help to create better prompts with context understanding.
> Try to adjust prompt to include other record values. Keep in mind that longer prompts can be more expensive and slower, so should smartly limit prompt length.

## Configuring plugin activation order

By default all plugins are activated in random order. 

Rarely, it might happen that your plugin somehow depends on other plugins (e.g. default AdminForth rich text editor plugin depends on AdminForth upload file to support images in text).

To control plugin activation order you can set `activationOrder` property in plugin class:

```ts title='./af-plugin-chatgpt/index.ts'
export default class ChatGptPlugin extends AdminForthPlugin {
  options: PluginOptions;

  activationOrder = 100;

  ...
}
```

Default value of activationOrder for most plugins is `0`. Plugins with higher activationOrder will be activated later.

To ensure that plugin activates before some other plugins set `activationOrder` to negative value.

## Splitting frontend logic into multiple files

In case your plugin `.vue` files getting too big, you can split them into multiple files (components)
Unfortunately when developing plugin, you should register such components(files) manually by calling `componentPath` in `modifyResourceConfig` method:


```ts title='./af-plugin-chatgpt/index.ts'
  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
//diff-add
      // we just call componentPath method to register component, not using it's result
//diff-add
      this.componentPath('subComponent.vue'),
    };
  }
```

Now to import `subComponent.vue` in `completionInput.vue` file you should use `@@/plugins/<plugin-class-name>/subComponent.vue` path:

```html title='./af-plugin-chatgpt/custom/completionInput.vue'
<template>
  ...
//diff-add
  <SubComponent />
  ...
</template>

<script setup lang="ts">
//diff-add
import SubComponent from '@@/plugins/ChatGptPlugin/subComponent.vue';
</script>
```

Pay attention that `ChatGptPlugin` is a class name of your plugin so it should be used in path.