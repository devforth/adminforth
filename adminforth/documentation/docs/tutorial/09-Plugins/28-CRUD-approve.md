---
title: CRUD Approve Plugin
description: "Guide to the CRUD Approve plugin, including installation, approval storage resource setup, wiring protected resources, approval flow, reviewer access, and optional two-factor verification for approved changes."
slug: /tutorial/Plugins/CRUDApprove
---

# CRUD Approve Plugin

The CRUD Approve plugin adds a manual approval step for changes made from the AdminForth back-office. Instead of applying `create`, `edit`, or `delete` operations immediately, selected resources can send these operations to an approval queue. A reviewer can then inspect the JSON diff and either approve or reject the pending change.

This is useful when several administrators can modify important records, but final responsibility for applying changes should stay with a smaller group of trusted users.

The plugin stores approval requests in a separate resource. Each request contains the target resource id, target record id, action type, request status, user who initiated the change, optional responder, old/new record data, and extra request metadata.

[Getting Started](../001-gettingStarted.md) will be used as the base for this example. The protected resource example below extends the `aparts` resource created in the Getting Started tutorial.

## Installation

Install the plugin:

```bash
pnpm i @adminforth/crud-approve-plugin --save
```

To import:

```ts title="./resources/crud_manual_approve.ts"
import CRUDApprovePlugin from '@adminforth/crud-approve-plugin';
import { AdminForthDataTypes, type AdminForthResourceInput } from 'adminforth';
```

> **Note**: An early draft of this plugin documentation used `@adminforth/crud-approve`. The current package name is `@adminforth/crud-approve-plugin`, so the examples below use that package name.

## Create approval table

First, add a table for manual approval requests. If you use the Prisma setup from the Getting Started tutorial, add the model below to `schema.prisma`:

```prisma title="./schema.prisma"
model crud_manual_approve {
  id           String   @id
  record_id    String?
  resource_id  String
  action       String
  data         Json
  user_id      String
  responser_id String?
  status       Int      @default(1)
  created_at   DateTime @default(now())
  extra        Json?

  @@index([status, created_at])
  @@index([resource_id])
}
```

Then run a migration:

```bash
pnpm makemigration --name add-crud-manual-approve ; pnpm migrate:local
```

The `status` column uses numeric values:

- `1` — pending
- `2` — approved
- `3` — rejected

## Create approval resource

Create `crud_manual_approve.ts` in the `resources` folder:

```ts title="./resources/crud_manual_approve.ts"
import CRUDApprovePlugin from '@adminforth/crud-approve-plugin';
import { AdminForthDataTypes, type AdminForthResourceInput } from 'adminforth';

export const crudApprovePlugin = new CRUDApprovePlugin({
  resourceColumns: {
    idColumnName: 'id',
    recordIdColumnName: 'record_id',
    resourceIdColumnName: 'resource_id',
    actionColumnName: 'action',
    dataColumnName: 'data',
    userIdColumnName: 'user_id',
    responserIdColumnName: 'responser_id',
    statusColumnName: 'status',
    createdAtColumnName: 'created_at',
    extraColumnName: 'extra',
  },
});

export default {
  dataSource: 'maindb',
  table: 'crud_manual_approve',
  resourceId: 'crud_manual_approve',
  label: 'CRUD approvals',
  recordLabel: (record: any) => `${record.resource_id} / ${record.action}`,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      showIn: { list: false, show: true, edit: false, create: false },
    },
    {
      name: 'record_id',
      label: 'Record ID',
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'resource_id',
      label: 'Resource',
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'action',
      enum: [
        { value: 'create', label: 'Create' },
        { value: 'edit', label: 'Edit' },
        { value: 'delete', label: 'Delete' },
      ],
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'data',
      type: AdminForthDataTypes.JSON,
      sortable: false,
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'user_id',
      label: 'Requested by',
      foreignResource: {
        resourceId: 'adminuser',
      },
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'responser_id',
      label: 'Responded by',
      foreignResource: {
        resourceId: 'adminuser',
      },
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'status',
      enum: [
        { value: 1, label: 'Pending' },
        { value: 2, label: 'Approved' },
        { value: 3, label: 'Rejected' },
      ],
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'extra',
      type: AdminForthDataTypes.JSON,
      showIn: { all: false },
      backendOnly: true,
    },
  ],
  options: {
    listPageSize: 10,
    allowedActions: {
      create: false,
      edit: false,
      delete: false,
      show: async ({ adminUser }: any) => {
        return ['superadmin', 'reviewer'].includes(adminUser.dbUser.role);
      },
      filter: async ({ adminUser }: any) => {
        return ['superadmin', 'reviewer'].includes(adminUser.dbUser.role);
      },
    },
  },
  plugins: [crudApprovePlugin],
} as AdminForthResourceInput;
```

The plugin replaces the default rendering of the `data` column with a diff viewer on list and show pages. For pending requests, the viewer also renders **Approve** and **Reject** actions.

> **Note**: Do not attach the approval interception hook to the `crud_manual_approve` resource itself. This resource is the queue used by the plugin.

## Register approval resource

Import the approval resource in `index.ts` and add it to the AdminForth resource list and menu:

```ts title="./index.ts"
//diff-add
import crudManualApproveResource from './resources/crud_manual_approve.js';

export const admin = new AdminForth({
  ...
  resources: [
    ...
    //diff-add 
    crudManualApproveResource,
  ],
  menu: [
    ...
    //diff-add 
    {
    //diff-add
      label: 'Approvals',
    //diff-add
      icon: 'flowbite:clipboard-check-solid',
    //diff-add
      resourceId: 'crud_manual_approve',
    //diff-add
    },
  ],
});
```

## Send resource changes to approval

Now choose the resource whose changes should require review. The example below protects the `aparts` resource from the Getting Started tutorial. Users can submit changes, but these changes are stored as approval requests instead of being applied immediately.

Open `resources/apartments.ts` and add the helper and hooks below:

```ts title="./resources/apartments.ts"
import { AdminForthDataTypes, type AdminForthResourceInput } from 'adminforth';
//diff-add 
import { crudApprovePlugin } from './crud_manual_approve.js';

//diff-add 
async function sendChangeToApproval({
//diff-add 
  resource,
//diff-add 
  action,
//diff-add 
  record,
//diff-add 
  updates,
//diff-add 
  oldRecord,
//diff-add 
  recordId,
//diff-add 
  adminUser,
//diff-add 
  extra,
//diff-add 
}: any) {
//diff-add 
  // When the CRUD Approve plugin applies an already approved change,
//diff-add 
  // it marks the request with this flag. In that case we must not create
//diff-add 
  // another approval request, otherwise the operation would loop forever.
//diff-add 
  if (extra?.adminforth_plugin_crud_approve?.callingFromApprovalPlugin) {
//diff-add 
    return { ok: true };
//diff-add 
  }
//diff-add
//diff-add 
  const pkColumnName = resource.columns.find((column: any) => column.primaryKey)?.name || 'id';
//diff-add 
  const data = recordId ? { [pkColumnName]: recordId } : record;
//diff-add
//diff-add 
  const result = await crudApprovePlugin.createApprovalRequest({
//diff-add 
    resource,
//diff-add 
    action,
//diff-add 
    data,
//diff-add 
    user: adminUser,
//diff-add 
    record,
//diff-add 
    oldRecord,
//diff-add 
    updates,
//diff-add 
    extra,
//diff-add 
  });
//diff-add
//diff-add 
  if (result.error) {
//diff-add 
    return { ok: false, error: result.error };
//diff-add 
  }
//diff-add
//diff-add 
  // Stop the original mutation. The real create/edit/delete will be executed
//diff-add 
  // later only if a reviewer approves the request.
//diff-add 
  return { ok: true, error: "Action sent for manual approval" };
//diff-add
}

export default {
  dataSource: 'maindb',
  table: 'apartments',
  resourceId: 'aparts',
  label: 'Apartments',
  ...
  columns: [
    ...
  ],
  //diff-add
  hooks: {
  //diff-add
    create: {
  //diff-add
      beforeSave: async (args: any) => {
  //diff-add
        return sendChangeToApproval({ ...args, action: 'create' });
  //diff-add
      },
  //diff-add
    },
  //diff-add
    edit: {
  //diff-add
      beforeSave: async (args: any) => {
  //diff-add
        return sendChangeToApproval({ ...args, action: 'edit' });
  //diff-add
      },
  //diff-add
    },
  //diff-add
    delete: {
  //diff-add
      beforeSave: async (args: any) => {
  //diff-add
        return sendChangeToApproval({ ...args, action: 'delete' });
  //diff-add
      },
  //diff-add
    },
  //diff-add
  },
  options: {
    listPageSize: 10,
    allowedActions: {
      create: true,
      edit: true,
      delete: true,
      show: true,
      filter: true,
    },
  },
} as AdminForthResourceInput;
```

That is it. Now create, edit, and delete operations on `aparts` will create pending records in the `CRUD approvals` resource.

## How approval works

When a user changes a protected resource:

1. The resource `beforeSave` hook calls `crudApprovePlugin.createApprovalRequest(...)`.
2. The original mutation is stopped.
3. A pending approval request is stored in `crud_manual_approve`.
4. A reviewer opens the `Approvals` resource and reviews the diff.
5. If the reviewer rejects the request, only the request status changes to `Rejected`.
6. If the reviewer approves the request, the plugin applies the original create/edit/delete operation and changes the request status to `Approved`.

The plugin also calls the protected resource hooks while applying approved changes. Because of that, the `callingFromApprovalPlugin` guard in the example above is important.

## Protect reviewer access

The approval resource should normally be visible only to users who are allowed to approve or reject changes. A simple role-based check can be added through `allowedActions`:

```ts title="./resources/crud_manual_approve.ts"
options: {
  allowedActions: {
    create: false,
    edit: false,
    delete: false,
    show: async ({ adminUser }: any) => {
      return ['superadmin', 'reviewer'].includes(adminUser.dbUser.role);
    },
    filter: async ({ adminUser }: any) => {
      return ['superadmin', 'reviewer'].includes(adminUser.dbUser.role);
    },
  },
},
```

You can also use a stricter policy and allow only `superadmin` users to open the approval queue.

## Optional: require 2FA before applying approved changes

If your application already uses the Two-Factor Authentication plugin, you can verify the confirmation result before the approved change is applied. Frontend confirmation alone is not a security boundary, so the backend must still verify the confirmation result in a protected resource hook.

The approval request handler passes approval request data through `extra.body`. If your approval UI sends a 2FA confirmation result in `meta.confirmationResult`, you can verify it before allowing the approved operation to continue.

```ts title="./resources/apartments.ts"
async function verifyApproval2FA({ adminUser, adminforth, extra }: any) {
  if (!extra?.adminforth_plugin_crud_approve?.callingFromApprovalPlugin) {
    return { ok: true };
  }

  const confirmationResult = extra?.body?.meta?.confirmationResult;
  if (!confirmationResult) {
    return { ok: false, error: 'Two-factor confirmation is required to approve this change' };
  }

  const t2fa = adminforth.getPluginByClassName('TwoFactorsAuthPlugin');
  if (!t2fa) {
    return { ok: false, error: 'TwoFactorsAuthPlugin is not configured' };
  }

  const verifyRes = await t2fa.verify(confirmationResult, {
    adminUser,
    userPk: adminUser.pk,
    extra,
  });

  if (!verifyRes?.ok) {
    return { ok: false, error: verifyRes?.error || 'Two-factor verification failed' };
  }

  return { ok: true };
}
```

Then call this check before `sendChangeToApproval` in the same protected resource hooks:

```ts title="./resources/apartments.ts"
hooks: {
  edit: {
    beforeSave: async (args: any) => {
      const twoFaResult = await verifyApproval2FA(args);
      if (twoFaResult.error) {
        return twoFaResult;
      }

      return sendChangeToApproval({ ...args, action: 'edit' });
    },
  },
},
```

For `create` and `delete`, use the same pattern and pass `action: 'create'` or `action: 'delete'`.

## Customizing approval data

The plugin stores `oldRecord` and `newRecord` in the `data` JSON column. This makes the pending request easy to inspect in the diff viewer.

You can pass additional metadata through `extra` when creating the approval request:

```ts title="./resources/apartments.ts"
const result = await crudApprovePlugin.createApprovalRequest({
  resource,
  action: 'edit',
  data: { id: recordId },
  user: adminUser,
  oldRecord,
  updates,
  extra: {
    ...extra,
    reason: 'Submitted from editorial workflow',
    source: 'admin-panel',
  },
});
```

This is useful when you want to keep extra audit context, for example request source, UI flow, or a business reason entered by the user.

## Using with several resources

The same approval queue can be reused for multiple resources. Add the `sendChangeToApproval` hook to every resource that must be reviewed:

```ts title="./resources/products.ts"
hooks: {
  create: {
    beforeSave: async (args: any) => sendChangeToApproval({ ...args, action: 'create' }),
  },
  edit: {
    beforeSave: async (args: any) => sendChangeToApproval({ ...args, action: 'edit' }),
  },
  delete: {
    beforeSave: async (args: any) => sendChangeToApproval({ ...args, action: 'delete' }),
  },
},
```

Each approval request stores its `resource_id`, so reviewers can see which resource the request belongs to.

## Troubleshooting

### The approval request is created, but the original change is also applied

Make sure your protected resource hook returns:

```ts
return { ok: false, error: null };
```

This stops the original mutation and leaves the change pending for review.

### Approved changes create another approval request

Make sure `sendChangeToApproval` starts with the guard below:

```ts
if (extra?.adminforth_plugin_crud_approve?.callingFromApprovalPlugin) {
  return { ok: true };
}
```

Without this guard, the approved operation can be intercepted again by the same hook.

### Diff viewer is not shown

Check that:

1. the plugin is installed on the approval resource;
2. `dataColumnName` points to a JSON column;
3. the `resourceColumns` mapping matches real column names in the approval table.

### Approve or reject button is not visible

Approve and reject controls are shown only for requests with `status = 1`.

### Reviewers cannot open the approval resource

Check `options.allowedActions` on the approval resource. The examples above allow only users with `superadmin` or `reviewer` role to show and filter approval requests.
