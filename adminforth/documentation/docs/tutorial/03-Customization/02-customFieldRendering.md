# Custom record field rendering

## Customizing how AdminForth renders the cells with record values

Let's change how AdminForth renders the number of rooms in the 'list' and 'show' views.
We will render '🟨' for each room and then we will print `square_meter` at the same cells.

Create directory `custom`. Create a file `RoomsCell.vue` in it:

```html title='./custom/RoomsCell.vue'
<template>
  <div class="flex items-center">
    <span v-for="room in record.number_of_rooms">
      🟨
    </span>
      
    {{ record.square_meter }} m²
  </div>
</template>

<script setup>
defineProps({
  record: Object,
  resource: Object,
  adminUser: Object,
  meta: Object,
  columns: Object
});
</script>
```

Now you can use this component in the configuration of the resource:

```ts title='./resources/apartments.ts'
{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      ...
      name: 'number_of_rooms',
//diff-add
     components: {
//diff-add
       show: '@@/RoomsCell.vue',
//diff-add
       list: '@@/RoomsCell.vue',
//diff-add
     }
    },
    ...
  ],
  ...
}
```
Here is how it looks:
![alt text](<Custom record field rendering.png>)

In very similar way you can render how cell is rendered in `'edit'` and `'create'` view. 
You can use it for creating custom editors for the fields. Check [component specs](/docs/api/types/AdminForthConfig/type-aliases/AdminForthFieldComponents#create) to understand which props are passed to the component

## Parametrizing the custom components

Sometimes you need to render same component with different parameters.
You can use [full component declaration](/docs/api/types/AdminForthConfig/type-aliases/AdminForthComponentDeclarationFull.md)


```ts title='./resources/apartments.ts'

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      ...
      name: 'number_of_rooms',
      components: {
//diff-remove
       show: '@@/RoomsCell.vue',
//diff-add
       show: {
//diff-add
         file: '@@/RoomsCell.vue',
//diff-add
         meta: {
//diff-add
           filler: '🟨',
//diff-add
         },
//diff-add
       },
//diff-remove
       list: '@@/RoomsCell.vue',
//diff-add
       list: {
//diff-add
         file: '@@/RoomsCell.vue',
//diff-add
         meta: {
//diff-add
           filler: '🟦',
//diff-add
          },
//diff-add
        }
      }
    },
    ...
  ],
  ...
}
```

Now our component can read `filler` from `meta` prop:

```ts title='./custom/RoomsCell.vue'
<template>
  <div class="flex items-center">
    <span v-for="room in record.number_of_rooms">
//diff-remove
     🟨
//diff-add
    {{ meta.filler }}
    </span>
    {{ room.square_meter }} m²
  </div>
</template>

<script setup>
defineProps({
  record: Object,
  resource: Object,
  adminUser: Object,
  meta: Object
  columns: Object
});
</script>
```

## Using 3rd-party npm packages in the components

To install 3rd-party npm packages you should create npm package in the `custom` directory:

```bash
cd custom
npm init -y
```

And simply do `npm install` for the package you need:

```bash
npm install <some package> --save-dev
```


## Pre-made renderers

Though creating custom renderers is super-easy, we have couple of pre-made renderers for you to use.

### CompactUUID

If you have a UUID column which you want display in table in more compact manner, you can use `CompactUUID` renderer.

```ts title='./resources/apartments.ts'
//diff-add
import { randomUUID } from 'crypto';

  ...
  columns: [
    { 
      name: 'id', 
      primaryKey: true,
//diff-remove
      showIn: ['filter', 'show'],
//diff-add
      showIn: ['list', 'filter', 'show'],
//diff-remove
      fillOnCreate: ({ initialRecord, adminUser }) => Math.random().toString(36).substring(7),
//diff-add
      fillOnCreate: ({initialRecord}: any) => randomUUID(),
//diff-add
      components: {
//diff-add
        list: '@/renderers/CompactUUID.vue'
//diff-add
      }
    }
  ...
```

![alt text](<Group 8.jpg>)


### Country Flag

Renders string fields containing ISO-3166-1 alpha-2 country codes as flags (e.g. 'US', 'DE', 'FR', etc.)

```ts title='./resources/apartments.ts'
  columns: [
    ...
    {
      name: 'country',
  //diff-add
      components: {
  //diff-add
        list: '@/renderers/CountryFlag.vue'
  //diff-add
      },
    ...
```

![alt text](<Group 13.png>)

You can also show country name after the flag:

```ts title='./resources/apartments.ts'
  columns: [
    ...
    {
      name: 'country',
  //diff-add
      components: {
  //diff-add
        list: {
  //diff-add
          file: '@/renderers/CountryFlag.vue',
  //diff-add
          meta: {
  //diff-add
            showCountryName: true
  //diff-add
          }
  //diff-add
        }
  //diff-add
      },
      ...
    }
```

![alt text](<Group 12 (1).jpg>)

### Human Number

It formats large numbers into a human-readable format (e.g., 10k, 1.5M) and supports localization for different number formats.

```ts title='./resources/apartments.ts'
  columns: [
    ...
    { 
          name: 'square_meter', 
          label: 'Square', 
          minValue: 1,  // you can set min /max value for number fields
          maxValue: 100000000,
          //diff-add
          components: {
          //diff-add
            list: {
          //diff-add
              file: '@/renderers/HumanNumber.vue',
          //diff-add
              meta: {
          //diff-add
                showCountryName: true,
          //diff-add
              }
          //diff-add
            }
          //diff-add
          }
        },
    {
    ...
```

![alt text](<HumanNumber.png>)


### URL

If your field has absolute URLs as text strings you can use `URLs` renderer to render them as clickable links.

```ts title='./resources/anyResource.ts'
  columns: [
    ...
    {
      name: 'url',
  //diff-add
      components: {
  //diff-add
        list: '@/renderers/URL.vue'
  //diff-add
      },
    ...
```