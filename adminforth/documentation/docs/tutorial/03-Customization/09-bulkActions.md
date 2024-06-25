# Custom bulk actions

You might need to give admin users a feature to perform same action on multiple records at once. 

For example you might want allow setting `listed` field to `false` for multiple appartment records at once. 

AdminForth by default provides a checkbox in first column of the list view for this purposes.
 
By default AdminForth provides only one bulk action `delete` which allows to delete multiple records at once 
(if deletion for records available by [resource.options.allowedActions](/docs/api/types/AdminForthConfig/type-aliases/AdminForthResource#optionsallowedactions))

To add custom bulk action quickly:

```ts
{
  ...
  resourceId: 'apparts',
  ...
  bulkActions: [
    {
     options: {
        bulkActions: [
          {
            label: 'Mark as listed',
            icon: 'flowbite:eye-solid',
            state:'active',
            confirm: 'Are you sure you want to mark all selected apartments as listed?',
            action: function ({selectedIds, adminUser}: any) {
              const stmt = db.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`);
              stmt.run(...selectedIds);
              return { ok: true, error: false, message: 'Marked as listed' }
            },
          }
        ],
      }
    }
  ]
}
```

Action code is called on the server side only and allowed to only authorized users. 

> 🫨 AdminForth provides no way to update the data, it is your responsibility to manage the data by selectedIds. You can use any ORM system
> or write raw queries to update the data.

> 🫨 You can use `adminUser` object to check whether user is allowed to perform bulk action

<screenshot here>