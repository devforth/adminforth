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

### VerticalTabs

Wrap each tab lable in tamplate with v-slot value `tab:TAB_ALIAS`. Wrap each tab content in tamplate with v-slot value `TAB_ALIAS`. `TAB_ALIAS` is a unique identifier for each tab here. Place all templates inside `VerticalTabs` component.

```js
import { VerticalTabs } from '@/afcl'
```

```vue
  <VerticalTabs>
    <template #tab:Profile>
      <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
      </svg>
      Profile
    </template>
    <template #tab:Dashboard>
      <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18"><path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/></svg>
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