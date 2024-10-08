
AuditLog plugin allows to limit access to the resource actions (list, show, create, update, delete) based on custom callback.
Callback accepts [AdminUser](/docs/api/types/AdminForthConfig/type-aliases/AdminUser/) which you can use to define access rules.


## Installation


```bash
npm i @adminforth/audit-log --save
```

Create `auditLogs.ts` in `resources` folder:

```ts title="./resources/auditLogs.ts"
import AuditLogPlugin from '@adminforth/audit-log';
import { AdminForthDataTypes } from 'adminforth'
import { v4 as uuid } from 'uuid';
```

[Getting Started](<../001-gettingStarted.md>) will be used as base for this example.


## Creating table for storing activity data
For the first, to track records changes, we need to set up the database and table with certain fields inside where tracked data will be stored.

First of all you should create this table in your own database `./schema.prisma`:

```ts title='./schema.prisma'
model audit_logs {
  id                String      @id
  created_at        DateTime  /// timestamp of applied change
  resource_id       String    /// identifier of resource where change were applied
  user_id           String    /// identifier of user who made the changes
  action            String    /// type of change (create, edit, delete)
  diff              String?   /// delta betwen before/after versions
  record_id         String?   /// identifier of record that been changed
}
```

And `prisma migrate`:

```bash
npx --yes prisma migrate dev --name init
```

Also to make this code start 

## Setting up the resource and dataSource for plugin
Logger sets up for all the resources by default. But you can exclude unwanted resources with option "excludeResourceIds". In this example, we'll exclude resource "users" from logging.

Also, it excludes itself to avoid infinte logging loop.

Add this code in `auditLogs.ts`:

```ts title='./resources/auditLogs.ts'
  export default {
    dataSource: 'maindb', 
    table: 'audit_logs',
    columns: [
      { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid() },
      { name: 'created_at', required: false },
      { name: 'resource_id', required: false },
      { name: 'user_id', required: false, 
          foreignResource: {
          resourceId: 'users',
        } },
      { name: 'action', required: false },
      { name: 'diff', required: false, type: AdminForthDataTypes.JSON, showIn: ['show'] },
      { name: 'record_id', required: false },
    ],
    options: {
      allowedActions: {
        edit: false,
        delete: false,
      }
    },
    plugins: [
      new AuditLogPlugin({
        // if you want to exclude some resources from logging
        //excludeResourceIds: ['users'],
        resourceColumns: {
          resourceIdColumnName: 'resource_id',
          resourceActionColumnName: 'action',
          resourceDataColumnName: 'diff',
          resourceUserIdColumnName: 'user_id',
          resourceRecordIdColumnName: 'record_id',
          resourceCreatedColumnName: 'created_at'
        }
      }),
    ],
  }
```

Then you need to import `./resources/auditLogs`:

```ts title="./index.ts"
//diff-add
import auditLogsResource from "./resources/auditLogs"


dataSources: [
    ...
  resources: [
    apartmentsResource,
    usersResource,
//diff-add
    auditLogsResource
  ],
    ...
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
