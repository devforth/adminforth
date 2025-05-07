# Actions

## Single record actions

You might need to give admin users a feature to perform some action on a single record. Actions can be displayed as buttons in the list view and/or in the three-dots menu.

Here's how to add a custom action:

```ts title="./resources/apartments.ts"
{
  resourceId: 'aparts',
  options: {
    actions: [
      {
        name: 'Auto submit',  // Display name of the action
        icon: 'flowbite:play-solid',  // Icon to display (using Flowbite icons)
        
        // Control who can see/use this action
        allowed: ({ adminUser, standardAllowedActions }) => {
          return true;  // Allow everyone
        },
        
        // Handler function when action is triggered
        action: async ({ recordId, adminUser }) => {
          console.log("auto submit", recordId, adminUser);
          return { 
            ok: true, 
            successMessage: "Auto submitted" 
          };
        },

        // Configure where the action appears
        showIn: {
          list: true,              // Show in list view
          showButton: true,        // Show as a button
          showThreeDotsMenu: true, // Show in three-dots menu
        }
      }
    ]
  }
}
```

### Action Configuration Options

- `name`: Display name of the action
- `icon`: Icon to show (using Flowbite icon set)
- `allowed`: Function to control access to the action
- `action`: Handler function that executes when action is triggered
- `showIn`: Controls where the action appears
  - `list`: whether to show in list view
  - `showButton`: whether to show as a button on show view
  - `showThreeDotsMenu`: when to show in the three-dots menu of show view

### Access Control

You can control who can use an action through the `allowed` function. This function receives:

```ts title="./resources/apartments.ts"
{
  options: {
    actions: [
      {
        name: 'Auto submit',
        allowed: async ({ adminUser, standardAllowedActions }) => {
          if (adminUser.dbUser.role !== 'superadmin') {
            return false;
          }
          return true;
        },
        // ... other configuration
      }
    ]
  }
}
```

The `allowed` function receives:
- `adminUser`: The current admin user object
- `standardAllowedActions`: Standard permissions for the current user

Return:
- `true` to allow access
- `false` to deny access
- A string with an error message to explain why access was denied

Here is how it looks:
![alt text](<Single record actions.png>)


You might want to allow only certain users to perform your custom bulk action. 

To implement this limitation use `allowed`:

If you want to prohibit the use of bulk action for user, you can do it this way:

```ts title="./resources/apartments.ts"
bulkActions: [
  {
    label: 'Mark as listed',
    icon: 'flowbite:eye-solid',
    allowed: async ({ resource, adminUser, selectedIds }) => {
      if (adminUser.dbUser.role !== 'superadmin') {
        return false;
      } 
      return true;
    },
    confirm: 'Are you sure you want to mark all selected apartments as listed?',
    action: async ({ resource, selectedIds, adminUser, tr }) => {
        const stmt = admin.resource('aparts').dataConnector.client.prepare(
          `UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`
        );
        await stmt.run(...selectedIds);

        return { ok: true, message: tr(`Marked ${selectedIds.length} apartments as listed`) };
    },
  }
],
```

### Action URL

Instead of defining an `action` handler, you can specify a `url` that the user will be redirected to when clicking the action button:

```ts title="./resources/apartments.ts"
{
  name: 'View details',
  icon: 'flowbite:eye-solid',
  url: '/resource/aparts',  // URL to redirect to
  showIn: {
    list: true,
    showButton: true,
    showThreeDotsMenu: true,
  } 
}
```

The URL can be:
- A relative path within your admin panel (starting with '/')
- An absolute URL (starting with 'http://' or 'https://')

To open the URL in a new tab, add `?target=_blank` to the URL:

```ts
{
  name: 'View on Google',
  icon: 'flowbite:external-link-solid',
  url: 'https://google.com/search?q=apartment&target=_blank',
  showIn: {
    list: true,
    showButton: true
  }
}
```

> ☝️ Note: You cannot specify both `action` and `url` for the same action - only one should be used.



## Custom bulk actions

You might need to give admin users a feature to perform same action on multiple records at once. 

For example you might want allow setting `listed` field to `false` for multiple apartment records at once. 

AdminForth by default provides a checkbox in first column of the list view for this purposes.
 
By default AdminForth provides only one bulk action `delete` which allows to delete multiple records at once 
(if deletion for records available by [resource.options.allowedActions](/docs/api/Back/interfaces/ResourceOptions/#allowedactions))

To add custom bulk action quickly:

```ts title="./resources/apartments.ts"
//diff-add
import { AdminUser } from 'adminforth';
//diff-add
import { admin } from '../index';

{
  ...
  resourceId: 'aparts',
     ...
     options: {
//diff-add
        bulkActions: [
//diff-add
          {
//diff-add
            label: 'Mark as listed',
//diff-add
            icon: 'flowbite:eye-solid',
//diff-add
            // if optional `confirm` is provided, user will be asked to confirm action
//diff-add
            confirm: 'Are you sure you want to mark all selected apartments as listed?',
//diff-add
            action: async function ({selectedIds, adminUser }: {selectedIds: any[], adminUser: AdminUser }) {
//diff-add
              const stmt = admin.resource('aparts').dataConnector.client.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`);
//diff-add
              await stmt.run(...selectedIds);
//diff-add
              return { ok: true, error: false, successMessage: `Marked ${selectedIds.length} apartments as listed` };
//diff-add
            },
//diff-add
          }
//diff-add
        ],
      }
}
```

Action code is called on the server side only and allowed to only authorized users. 

> ☝️ AdminForth provides no way to update the data, it is your responsibility to manage the data by selectedIds. You can use any ORM system
> or write raw queries to update the data.

> ☝️ You can use `adminUser` object to check whether user is allowed to perform bulk action


> Action response can return optional `successMessage` property which will be shown to user after action is performed. If this property is not provided, no messages will be shown to user.

Here is how it looks:
![alt text](<Custom bulk actions.png>)


## Limiting access to bulk actions

You might want to allow only certain users to perform your custom bulk action. 

To implement this limitation use `allowed`:

If you want to prohibit the use of bulk action for user, you can do it this way:

```ts title="./resources/apartments.ts"
bulkActions: [
  {
    label: 'Mark as listed',
    icon: 'flowbite:eye-solid',
//diff-add
    allowed: async ({ resource, adminUser, selectedIds }) => {
//diff-add     
      if (adminUser.dbUser.role !== 'superadmin') {
//diff-add       
        return false;
//diff-add
        } 
//diff-add       
        return true;
//diff-add       
    },
      // if optional `confirm` is provided, user will be asked to confirm action
    confirm: 'Are you sure you want to mark all selected apartments as listed?',
    action: async function ({selectedIds, adminUser }: {selectedIds: any[], adminUser: AdminUser }, allow) {
      const stmt = admin.resource('aparts').dataConnector.client.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')}`);
      await stmt.run(...selectedIds);
      return { ok: true, error: false, successMessage: `Marked ${selectedIds.length} apartments as listed` };
    },
  }
],
```