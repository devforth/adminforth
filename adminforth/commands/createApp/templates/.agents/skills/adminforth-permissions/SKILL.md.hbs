---
name: adminforth-permissions
description: "Use when implementing or changing AdminForth access control: allowedActions, showIn callbacks, menu visibility, per-record restrictions, and permission-aware resource behavior."
user-invocable: true
---

# AdminForth Permissions Workflow

## When to Use

- Editing `options.allowedActions`, column `showIn.*` callbacks, menu visibility, or other permission-sensitive resource behavior.
- Deciding whether a rule belongs in `allowedActions`, `showIn[x]`, or a hook that blocks access for specific records.
- Explaining why hiding a menu item is not the same as real authorization.

## Permission Model

- `allowedActions` is the real per-resource permission layer for `list`, `show`, `create`, `edit`, `delete`, and `filter`.
- `showIn[x]` is the real per-column and per-page-flow control for whether a field is accessible in a given UI flow.
- Menu visibility is UX only. Hiding a resource from the menu does not block direct URL access or API access.
- For per-record restrictions, use hooks that run before datasource access or before save and return `{ ok: false, error: 'message' }`.

## Allowed Actions Rules

- `allowedActions` can be static booleans or async functions.
- The callback receives `adminUser`, `resource`, `meta`, `source`, and `adminforth`.
- `source` tells you why the permission is being checked. Available values are `displayButtons`, `listRequest`, `showRequest`, `editLoadRequest`, `editRequest`, `createRequest`, `deleteRequest`, `bulkActionRequest`, and `customActionRequest`.
- `allowedActions` is evaluated for both UI rendering and real requests, so keep it fast and avoid unnecessary database work.
- Use `source === ActionCheckSource.DisplayButtons` only when you intentionally want different UI visibility from actual request authorization.

## Example

```ts
import { ActionCheckSource } from 'adminforth';

{
	resourceId: 'orders',
	options: {
		allowedActions: {
			list: ({ adminUser }) => adminUser.dbUser.role !== 'suspended',
			delete: ({ adminUser, source }) => {
				// `source` tells you why AdminForth is checking permission.
				// This keeps the delete button visible, but blocks the real delete
				// unless the request is made by a superadmin.
				if (source === ActionCheckSource.DisplayButtons) {
					return true;
				}

				return adminUser.dbUser.role === 'superadmin';
			},
		},
	},
}
```

## Choosing the Right Layer

- Use `allowedActions` for coarse resource-level permissions such as role-based create, edit, delete, or list access.
- Use `showIn[x]` when a field should be visible or editable only in specific flows or for specific admins.
- Use hooks when access depends on actual record values, request filters, or lifecycle context.