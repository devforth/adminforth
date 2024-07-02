





# Hooks

Hooks are used to:

- modify the data before it is saved to the database on create or update
- execute something after data were saved or deleted
- change the query before fetching items from the database
- modify the fetched data before it is displayed in the list and show
- prevent the request to db depending on some condition (Better use [allowedActions](#limiting-access-to-the-resource-actions) for this)

## Modify the data before it is saved to the database

Let's add reference to `adminUser` when user creates a new apartment:

```ts title='./index.ts'
// diff-add
import type { AdminUser } from  'adminforth/types/AdminForthConfig.js';

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'realtor_id',
      ...
+      showIn: ['list', 'show', 'edit'], // don't even show this field in create
      ...
    },
    ...
  ],
  ...
+  hooks: {
+    create: {
+      beforeSave: async ({ adminUser, record }: { adminUser: AdminUser, record: any }) => {
+        if (adminUser.isRoot) {
+          return { ok: false, error: "Root user can't create appartment, relogin as DB user" };
+        }
+        record.realtor_id = adminUser.dbUser.id;
+        return { ok: true, record };
+      }
+    }
+  }
}
```
