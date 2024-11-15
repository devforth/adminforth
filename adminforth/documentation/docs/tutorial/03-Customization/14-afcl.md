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