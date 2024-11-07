# Custom bulk actions

You might need to give admin users a feature to perform same action on multiple records at once. 

For example you might want allow setting `listed` field to `false` for multiple apartment records at once. 

AdminForth by default provides a checkbox in first column of the list view for this purposes.
 
By default AdminForth provides only one bulk action `delete` which allows to delete multiple records at once 
(if deletion for records available by [resource.options.allowedActions](/docs/api/types/Back/interfaces/AdminForthResource#optionsallowedactions))

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
            action: function ({selectedIds, adminUser }: {selectedIds: any[], adminUser: AdminUser }) {
//diff-add
              const stmt = admin.resource('aparts').dataConnector.db.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`);
//diff-add
              stmt.run(...selectedIds);
//diff-add
              return { ok: true, error: false, successMessage: `Marked ${selectedIds.length} apartments as listed` };
//diff-add
            },
//diff-add
          }
//diff-add
        ],
//diff-add
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
    state:'active',
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
    action: function ({selectedIds, adminUser }: {selectedIds: any[], adminUser: AdminUser }, allow) {
      const stmt = admin.resource('aparts').dataConnector.db.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')}`);
      stmt.run(...selectedIds);
      return { ok: true, error: false, successMessage: `Marked ${selectedIds.length} apartments as listed` };
    },
  }
],
```