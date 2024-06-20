


# Limiting access to the resource actions



You can use `options.allowedActions` on resource to limit access to the resource actions (list, show, create, update, delete).

If you want to disable deletion of the resource records for all users:

```ts
...
resourceId: 'users',
...
options: {
  allowedActions: {
    delete: false
  }
  ...
}
```

If you want to disable creating and editing of new users for all users apart from users with role `superadmin`, but disable deletion for all users:

```ts
async function canModifyUsers(adminUser: AdminUser, resource: AdminForthResource, meta: any) => {
  return adminUser.role === 'superadmin';
}
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
```