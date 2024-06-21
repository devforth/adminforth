





## Hooks

Hooks are used to:

- modify the data before it is saved to the database on create or update
- execute something after data were saved or deleted
- change the query before fetching items from the database
- modify the fetched data before it is displayed in the list and show
- prevent the request to db depending on some condition (Better use [allowedActions](#limiting-access-to-the-resource-actions) for this)

### Modify the data before it is saved to the database

Let's add id to adminUser when user creates a new appartment:

```ts
import type { AdminUser } from  'adminforth/types/AdminForthConfig.js';

{
  ...
  resourceId: 'apparts',
  ...
  columns: [
    ...
    {
      name: 'user_id',
      ...
      showIn: ['list', 'show', 'edit'], // don't even show this field in create
      ...
    },
    ...
  ],
  ...
  hooks: {
    create: {
      beforeSave: async ({ adminUser, record }: { adminUser: AdminUser, record: any }) => {
        if (adminUser.isRoot) {
          return { ok: false, error: "Root user can't create appartment, relogin as DB user" };
        }
        record.user_id = adminUser.dbUser.id;
        return { ok: true, record };
      }
    }
  }
}
```

## Limiting access to the resource actions


### Statically disable some action

You can use `options.allowedActions` on resource to limit access to the resource actions (list, show, create, edit, delete).

If you want to disable deletion of the resource records for all users:

```ts
{
  ...
  resourceId: 'users',
  ...
  options: {
    allowedActions: {
      delete: false
    }
    ...
  }
}
```

### Disable some action based on logged in user record or role

If you want to disable deletion of apartments for all users apart from users with role `superadmin`:

```ts
import type { AdminUser } from  'adminforth/types/AdminForthConfig.js';

{
  ...
  resourceId: 'apparts',
  ...
  options: {
    allowedActions: {
      delete: async ({ adminUser }: { adminUser: AdminUser }): Promise<boolean> => {
        // important: if adminUser.isRoot, the adminUser.dbUser is undefined
        return adminUser.isRoot || adminUser.dbUser.role === 'superadmin';
      }
    }
    ...
  }
}
```

> ℹ️ TIP: instead of reading role from user you can check permission using complex ACL/RBAC models with permissions stored in the database.
> However we recommend you to keep in mind that allowedActions callback is called on every request related to resource, so it should be fast.
> So try to minimize requests to database as much as possible.

### Reuse the same callback for multiple actions

Let's disable creating and editing of new users for all users apart from users with role `superadmin`, and at the same time disable deletion for all users:

```ts

import type { AdminUser } from  'adminforth/types/AdminForthConfig.js';

async function canModifyUsers({ adminUser }: { adminUser: AdminUser }): boolean {
  // important: if adminUser.isRoot, the adminUser.dbUser is undefined
  return adminUser.isRoot || adminUser.dbUser.role === 'superadmin';
}

{
  ...
  resourceId: 'users',
  ...
  options: {
    allowedActions: {
      create: canModifyUsers,
      edit: canModifyUsers,
      delete: false
    }
    ...
  }
}
```

### Customizing the access control based on resource values

More advanced case, allow to edit apartments only if user is owner of the apartment (defined as user_id), otherwise return error
"You are not assigned to this apartment and can't edit it":

```ts
import type { AdminUser, ActionCheckSource } from  'adminforth/types/AdminForthConfig.js';

async function canModifyAppart({ adminUser, source, meta }: { adminUser: AdminUser, meta: any, source: ActionCheckSource }): boolean {
  if (source === ActionCheckSource.DisplayButtons) {
    // if check is done for displaying button - we show button to everyone
    return true; 
  }
  if (adminUser.isRoot) {
    return "Root user can't create appartment, relogin as DB user"; 
  }
  const { oldRecord, newRecord } = meta;
  if (oldRecord.user_id !== adminUser.dbUser.id) {
    return "You are not assigned to this apartment and can't edit it";
  }
  if (newRecord.user_id !== oldRecord.user_id) {
    return "You can't change the owner of the apartment";
  }
  return true;
}


{
  ...
  resourceId: 'apparts',
  ...
  options: {
    allowedActions: {
      edit: canModifyAppart,
    }
    ...
  }
}
```