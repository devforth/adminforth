# AdminForth Components Library


ACL is a new set of components which you can use as build blocks. 
This allows to keep the design consistent with minimal efforts. ACL components will follow styling standard and respect theme colors.


## Button

```js
import { Button } from '@/afcl'
```

```vue
<Button @click="doSmth" :loader="showLoader" class="w-full">
  Your button text
</Button>
```

loader prop would show loader when it's true.


## Link

```js
import { Link } from '@/afcl'
```

```vue
<Link to="/login">Go to login</Link>
```

## LinkButton

Looks like button but works like link. Uses `router-link` under the hood.

```js
import { LinkButton } from '@/afcl'
```

```vue
<LinkButton to="/login">Go to login</LinkButton>
```

## Select

```js
import { Select } from '@/afcl'


const selected = ref(null)
```

### Single

```vue
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

```vue
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

```vue
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


### Input

```vue

<Input type="number" class="w-full">
  <template #suffix>
    USD
  </template>
</Input>

```

### Tooltip
  
Wrap an element on which you would like to show a tooltip with the `Tooltip` component and add a `tooltip` slot to it.
  
```js
import { Tooltip } from '@/afcl'
```

```vue
<Tooltip>
    <a :href="`https://google.com?q=${record.title}`">
        <IconCardSearch class="w-5 h-5 me-2"/>
    </a>

    <template #tooltip>
        Search for competitive apartments in Google
    </template>
</Tooltip>
```
