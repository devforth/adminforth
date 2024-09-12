





# Hooks

Hooks are used to:

- modify the data before it is saved to the database on create or update
- execute something after data were saved or deleted
- change the query before fetching items from the database
- modify the fetched data before it is displayed in the list and show
- prevent the request to db depending on some condition (Better use [allowedActions](./05-limitingAccess.md) for this)


## Modify the data before it is saved to the database

Let's add reference to `adminUser` when user creates a new apartment:

```ts title='./index.ts'
// diff-add
import type { AdminUser } from  'adminforth';

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'realtor_id',
      ...
//diff-add
      showIn: ['list', 'show', 'edit'], // don't even show this field in create
      ...
    },
    ...
  ],
  ...
//diff-add
  hooks: {
//diff-add
    create: {
//diff-add
      beforeSave: async ({ adminUser, record }: { adminUser: AdminUser, record: any }) => {
//diff-add
        record.realtor_id = adminUser.dbUser.id;
//diff-add
        return { ok: true, record };
//diff-add
      }
//diff-add
    }
//diff-add
  }
}
```


## All hooks

Check all hooks in the [API reference](https://adminforth.dev/docs/api/types/AdminForthConfig/type-aliases/AdminForthResource).