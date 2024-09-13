
AuditLog plugin allows to limit access to the resource actions (list, show, create, update, delete) based on custom callback.
Callback accepts [AdminUser](/docs/api/types/AdminForthConfig/type-aliases/AdminUser/) which you can use to define access rules.


## Installation


```bash
npm i @adminforth/audit-log --save
```

Import:

```ts title='./index.ts'
import AuditLogPlugin from '@adminforth/audit-log';
```

[Getting Started](<../001-gettingStarted.md>) will be used as base for this example.


## Creating table for storing activity data
For the first, to track records changes, we need to set up the database and table with certain fields inside where tracked data will be stored.

First of all you should create this table in your own database. In our example we will continue using SQLite database we created
in [Getting Started](<../001-gettingStarted.md>). Just add the following code to the end of `initDataBase` function in `index.ts` file:

```ts title='./index.ts'
async function initDataBase() {
  ...
//diff-add
  const auditTableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs';`).get();
//diff-add
  if (!auditTableExists) {
//diff-add
    await db.prepare(`
//diff-add
      CREATE TABLE audit_logs (
//diff-add
        id uuid NOT NULL,  -- identifier of applied change record 
//diff-add
        created_at timestamp without time zone, -- timestamp of applied change
//diff-add
        resource_id varchar(255), -- identifier of resource where change were applied
//diff-add
        user_id uuid, -- identifier of user who made the changes
//diff-add
        "action" varchar(255), -- type of change (create, edit, delete)
//diff-add
        diff text, -- delta betwen before/after versions
//diff-add
        record_id varchar, -- identifier of record that been changed
//diff-add
        PRIMARY KEY(id)
//diff-add
      );`).run();
//diff-add
  }
}
```

Also to make this code start 

## Setting up the resource and dataSource for plugin
Logger sets up for all the resources by default. But you can exclude unwanted resources with option "excludeResourceIds". In this example, we'll exclude resource "users" from logging.

Also, it excludes itself to avoid infinte logging loop.

```ts title='./index.ts'
//diff-add
import { v4 as uuid } from 'uuid';
...
  resources: [
  ...
//diff-add
  {
//diff-add
      dataSource: 'maindb', 
//diff-add
      table: 'audit_logs',
//diff-add
      columns: [
//diff-add
        { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid() },
//diff-add
        { name: 'created_at', required: false },
//diff-add
        { name: 'resource_id', required: false },
//diff-add
        { name: 'user_id', required: false, 
            foreignResource: {
            resourceId: 'users',
        } },
//diff-add
        { name: 'action', required: false },
//diff-add
        { name: 'diff', required: false, type: AdminForthDataTypes.JSON, showIn: ['show'] },
//diff-add
        { name: 'record_id', required: false },
//diff-add
      ],
//diff-add
      options: {
//diff-add
        allowedActions: {
//diff-add
            edit: false,
//diff-add
            delete: false,
//diff-add
        }
//diff-add
      },
//diff-add
      plugins: [
//diff-add
        new AuditLogPlugin({
//diff-add
            // if you want to exclude some resources from logging
//diff-add
            //excludeResourceIds: ['users'],
//diff-add
            resourceColumns: {
//diff-add
                resourceIdColumnName: 'resource_id',
//diff-add
                resourceActionColumnName: 'action',
//diff-add
                resourceDataColumnName: 'diff',
//diff-add
                resourceUserIdColumnName: 'user_id',
//diff-add
                resourceRecordIdColumnName: 'record_id',
//diff-add
                resourceCreatedColumnName: 'created_at'
//diff-add
            }
//diff-add
        }),
//diff-add
      ],
//diff-add
    }
  ]
```

Also, we need to add it to menu:
```ts
menu: [
  ...
//diff-add
  {
//diff-add
      label: 'Audit Logs',
//diff-add
      icon: 'flowbite:search-outline',
//diff-add
      resourceId: 'audit_logs',
//diff-add
  }
]
```

That's it! Now you can see the logs in the table 

![alt text](AuditLog.png)

See [API Reference](/docs/api/plugins/audit-log/types/type-aliases/PluginOptions.md) for more all options.
