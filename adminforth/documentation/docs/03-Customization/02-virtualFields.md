
# Virtual columns

Sometimes you need to visualize custom columns which do not exist in database. 
For doing this you can use `virtual` columns.

```ts
...
resourceId: 'apparts',
...
columns: [
  ...
  {
    label: 'Country',
    type: AdminForthDataTypes.STRING,
    virtual: true,
    showIn: [AdminForthResourcePages.SHOW, AdminForthResourcePages.LIST],
    components: {
      show: '@@/CountryFlag.vue',
      list: '@@/CountryFlag.vue',
    },
  }
  ...
]
 ```
 
 This field will be displayed in show and list views with custom component `CountryFlag.vue`. CountryFlag.vue should be placed in ustom folder and can be next:
 
 ```vue
 <template>
  {{ getFlagEmojiFromIso(record.ipCountry) }}
 </template>
 
 <script setup>
 const props = defineProps(['record']);
 
 function getFlagEmojiFromIso(iso) {
    return iso.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
 }
 </script>
 ```