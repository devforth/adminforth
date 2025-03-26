
# Virtual columns

## Virtual column for show and list

Sometimes you need to visualize custom columns which do not exist in database. 
For doing this you can use `virtual` columns.

```ts title='./resources/apartments.ts'

//diff-add
import { AdminForthResourcePages } from 'adminforth';

...
resourceId: 'aparts',
columns: [
  ...
//diff-add
  {
//diff-add
    name: 'Country Flag',
//diff-add
    label: 'Country Flag',
//diff-add
    type: AdminForthDataTypes.STRING,
//diff-add
    virtual: true,
//diff-add
    showIn: {
//diff-add
      [AdminForthResourcePages.edit]: false,
//diff-add
      [AdminForthResourcePages.create]: false,
//diff-add
      [AdminForthResourcePages.filter]: false,
//diff-add
    },
//diff-add
    components: {
//diff-add
      show: '@@/CountryFlag.vue',
//diff-add
      list: '@@/CountryFlag.vue',
//diff-add
    },
//diff-add
  }
  ...
]
```
 
 This field will be displayed in show and list views with custom component `CountryFlag.vue`.
 Create file `CountryFlag.vue` in `custom` folder of your project:
 
 ```html title="./custom/CountryFlag.vue"
 <template>
    {{ getFlagEmojiFromIso(record.country) }}
</template>
   
<script setup lang="ts">
  import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

  const props = defineProps<{
      column: AdminForthResourceColumnCommon;
      record: any;
      meta: any;
      resource: AdminForthResourceCommon;
      adminUser: AdminUser
  }>();
    
   function getFlagEmojiFromIso(iso) {
      return iso?.toUpperCase()?.replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
   }
</script>
```

Here is how it looks:

![alt text](<Virtual columns.png>)


## Virtual columns for editing.

Another usecase of `virtual` columns is to add new fields in edit and create view. In the [Getting started](/docs/tutorial/001-gettingStarted.md) we used this feature to add `password` field to the `adminuser` resource. 
Thing is that password itself can't be stored in the database, but instead their hash is stored. 
So we need to add `password` field to the `adminuser` resource and make it `virtual` so it will not be stored in the database.

```ts title="./resources/adminuser.ts"
...
resourceId: 'adminuser',
...
columns: [
  ...
  {
    name: 'password',
    virtual: true,  // field will not be persisted into db
    required: { create: true }, // make required only on create page
    editingNote: { edit: 'Leave empty to keep password unchanged' },
    minLength: 8,
    type: AdminForthDataTypes.STRING,
    showIn: { // to show field only on create and edit pages
      show: false,
      list: false,
      filter: false,
    },
    masked: true, // to show stars in input field
  }
  ...
]
 ```

Now to handle virtual `password` field we use hooks:
 

```ts title="./resources/adminuser.ts"
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        return { ok: true };
      }
    },
    edit: {
      beforeSave: async ({ updates, adminUser, resource }: { updates: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        if (updates.password) {
          updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
        }
        return { ok: true }
      },
    },
  },
```

Hook still has access to the virtual field `updates.password`, and we use built-in AdminForth hasher to hash password and write it into
`password_hash` field which exists in database.

After hook is executed, `updates.password` will be removed from the record since it is virtual, so password itself will not be saved to the database.


### Backend-only fields

Another important point is that `hashed_password` field should never be passed to frontend due to security reasons.

To do it we have 2 options:

1) Do not list `password_hash` in the `columns` array of the resource. If AdminForth knows nothing about field
it will never pass this field to frontend.
2) Define `password_hash` in columns way but set `backendOnly`. The scond option is more explicit and should be preferrred

```ts
{
  name: 'password_hash',
  type: AdminForthDataTypes.STRING,
  showIn: { all: false },
  backendOnly: true,  // will never go to frontend
}
```