
AccessControl plugin allows to limit access to the resource actions (list, show, create, update, delete) based on custom callback.
Callback accepts [AdminUser](/docs/api/types/AdminForthConfig/type-aliases/AdminUser/) which you can use to define access rules.


## Usage


Import plugin:

```ts
import AccessControl from 'adminforth/plugins/AccessControl';
```
If you are using pure Node without TypeScript, you can use the following code:

```js
import AccessControl from 'adminforth/dist/plugins/AccessControl/index.js';
```

In [Getting Started](<../Getting Started.md>) we created a `'users'` resource which has a field `'role'`. During user creation 
in admin panel we can set the role of the user. Let's add the plugin to the resource configuration:

```ts
{ 
    ...
    resourceId: 'users',
    ...
    plugins: [
      new AccessControlPlugin({
          hasAccess: async (adminUser: AdminUser, action: AllowedActionsEnum) => {
            // don't allow for non superadmin and non root users to edit and create users
            if (['edit', 'create'].includes(action) && !adminUser.isRoot && adminUser.dbUser.role !== 'superadmin') {
              return `You don't have access to ${action} this resource. Contact admin for more information.`
            }
            return true;
          },
      }),
    ], 
}
```

> ℹ️ TIP: If you wish you can use [visible](/docs/api/types/AdminForthConfig/type-aliases/AdminForthConfigMenuItem#visible) callback on menu item to hide some resources from the menu depending on the user role.




See [API Reference](/docs/api/plugins/AccessControl/types/type-aliases/PluginOptions) for more all options.