
AuditLog plugin allows to limit access to the resource actions (list, show, create, update, delete) based on custom callback.
Callback accepts [AdminUser](/docs/api/types/AdminForthConfig/type-aliases/AdminUser/) which you can use to define access rules.


## Installation


Plugin is already installed into adminforth, to import:

```ts
import AuditLogPlugin from 'adminforth/plugins/AuditLogPlugin';
```
If yu are using pure Node without TypeScript, you can use the following code:

```js
import AuditLogPlugin from 'adminforth/dist/plugins/AuditLogPlugin/index.ts';
```

[Getting Started](<../01-gettingStarted.md>) will be used as base for this example.


## Creating table for storing activity data
For the first, to track records changes, we need to set up the database and table with certain fields inside.

```sql
CREATE TABLE audit_logs(
    id uuid NOT NULL,  -- identifier of applied change record 
    created_at timestamp without time zone, -- timestamp of applied change
    resource_id varchar(255), -- identifier of resource where change were applied
    user_id uuid, -- identifier of user who made the changes
    "action" varchar(255), -- type of change (create, edit, delete)
    diff text, -- delta betwen before/after versions
    record_id varchar, -- identifier of record that been changed
    PRIMARY KEY(id)
);
```

See [API Reference](/docs/api/plugins/AuditLogPlugin/types/type-aliases/PluginOptions.md) for more all options.
