# Actions

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
        action: ({ recordId, adminUser }) => {
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

## Action Configuration Options

- `name`: Display name of the action
- `icon`: Icon to show (using Flowbite icon set)
- `allowed`: Function to control access to the action
- `action`: Handler function that executes when action is triggered
- `showIn`: Controls where the action appears
  - `list`: Show in list view
  - `showButton`: Show as a button
  - `showThreeDotsMenu`: Show in three-dots menu

## Access Control

You can control who can use an action through the `allowed` function. This function receives:

```ts title="./resources/apartments.ts"
{
  options: {
    actions: [
      {
        name: 'Auto submit',
        allowed: ({ adminUser, standardAllowedActions }) => {
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
![alt text](<Custom bulk actions.png>)


You might want to allow only certain users to perform your custom bulk action. 

To implement this limitation use `allowed`:

If you want to prohibit the use of bulk action for user, you can do it this way:

```ts title="./resources/apartments.ts"
bulkActions: [
  {
    label: 'Mark as listed',
    icon: 'flowbite:eye-solid',
    state:'active',
    allowed: async ({ resource, adminUser, selectedIds }) => {
      if (adminUser.dbUser.role !== 'superadmin') {
        return false;
      } 
      return true;
    },
    confirm: 'Are you sure you want to mark all selected apartments as listed?',
    action: function ({selectedIds, adminUser }: {selectedIds: any[], adminUser: AdminUser }, allow) {
      const stmt = admin.resource('aparts').dataConnector.client.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')}`);
      stmt.run(...selectedIds);
      return { ok: true, error: false, successMessage: `Marked ${selectedIds.length} apartments as listed` };
    },
  }
],
```

## Action URL

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