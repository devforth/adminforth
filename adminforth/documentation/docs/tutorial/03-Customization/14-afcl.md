# AdminForth Components Library


ACL is a new set of components which you can use as build blocks. 
This allows to keep the design consistent with minimal efforts. ACL components will follow styling standard and respect theme colors.


## Button

```js
import { Button } from '@/afcl'
```

```html
<Button @click="doSmth" :loader="showLoader" class="w-full">
  Your button text
</Button>
```

loader prop would show loader when it's true.


## Link

```js
import { Link } from '@/afcl'
```

```html
<Link to="/login">Go to login</Link>
```

## LinkButton

Looks like button but works like link. Uses `router-link` under the hood.

```js
import { LinkButton } from '@/afcl'
```

```html
<LinkButton to="/login">Go to login</LinkButton>
```

## Select

```js
import { Select } from '@/afcl'


const selected = ref(null)
```

### Single

```html
<Select
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
    {label: 'None', value: null}
  ]"
  v-model="selected"
></Select>
```

### Multiple

```html
<Select
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
    {label: 'None', value: null}
  ]"
  v-model="selected"
  multiple
></Select>
```


### Custom slots for item

```html
<Select
    :options="[
      {label: 'Last 7 days', value: '7', records: 110},
      {label: 'Last 30 days', value: '30', records: 320},
      {label: 'Last 90 days', value: '90', records: 310},
      {label: 'None', value: null}
    ]"
    v-model="selected"
  >
    <template #item="{option}">
      <div>
        <span>{{ option.label }}</span>
        <span class="ml-2 opacity-50">{{ option.records }} records</span>
      </div>
    </template>

    <template #selected-item="{option}">
      <span>{{ option.label }} 💫</span>
    </template>
  </Select>
</div>
```


![alt text](<Group 21.jpg>)

### Extra item

You might need to put some extra item at bottom of list

```html
<Select
  :options="prices.map(price => ({label: price, value: price}))"
  v-model="selected"
>
  <template #extra-item>
    <LinkButton to="/prices">Manage prices</LinkButton>
  </template>
</Select>
```

## Input

```html

<Input type="number" class="w-full">
  <template #suffix>
    USD
  </template>
</Input>

```

## Tooltip
  
Wrap an element on which you would like to show a tooltip with the `Tooltip` component and add a `tooltip` slot to it.
  
```js
import { Tooltip } from '@/afcl'
```

```html
<Tooltip>
    <a :href="`https://google.com?q=${record.title}`">
        <IconCardSearch class="w-5 h-5 me-2"/>
    </a>

    <template #tooltip>
        Search for competitive apartments in Google
    </template>
</Tooltip>
```

## VerticalTabs

Wrap each tab lable in tamplate with v-slot value `tab:TAB_ALIAS`. Wrap each tab content in tamplate with v-slot value `TAB_ALIAS`. `TAB_ALIAS` is a unique identifier for each tab here. Place all templates inside `VerticalTabs` component.

```js
import { VerticalTabs } from '@/afcl'
import { IconGridSolid, IconUserCircleSolid } from '@iconify-prerendered/vue-flowbite';
```

```html
  <VerticalTabs>
    <template #tab:Profile>
      <IconUserCircleSolid class="w-5 h-5 me-2"/>
      Profile
    </template>
    <template #tab:Dashboard>
      <IconGridSolid class="w-5 h-5 me-2"/>
      Dashboard
    </template>
    <template #Profile>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Profile Tab</h3>
      <p class="mb-2">This is some placeholder content the Profile tab's associated content, clicking another tab will toggle the visibility of this one for the next.</p>
    </template>
    <template #Dashboard>
      Dashboard Tab Content 
    </template>
  </VerticalTabs>
```

## Checkbox

```html
<Checkbox v-model="enable">
  Enable
</Checkbox>
```

```ts
import { Checkbox } from '@/afcl'
const enable = ref(false)
```

## Dropzone

```html
<Dropzone
  :extensions="['.jpg', '.jpeg', '.png']"
  :maxSizeBytes="1024 * 1024 * 2"
  :multiple="false"
  v-model="files"
/>

```

```ts
import { Ref } from 'vue'
import { Dropzone } from '@/afcl'

const files: Ref<File[]> = ref([])

watch(files, (files) => {
  console.log('files selected', files);
  setTimeout(() => {
    // clear
    files.length = 0;
  }, 5000);
})
```
