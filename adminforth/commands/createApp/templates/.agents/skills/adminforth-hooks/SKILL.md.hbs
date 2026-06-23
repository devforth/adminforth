---
name: adminforth-hooks
description: "Use when implementing or changing AdminForth hooks: beforeDatasourceRequest, afterDatasourceResponse, beforeSave, afterSave, and source-aware show or edit flows."
user-invocable: true
---

# AdminForth Hooks Workflow

## When to Use

- Editing `resource.hooks` in `resources/*.ts`.
- Deciding which hook stage should own filtering, normalization, enrichment, validation, or side effects.
- Handling the difference between show-page requests and edit-page initial load.

## Hook Rules

- Hooks execute on the backend during AdminForth request handling.
- Keep hooks fast because every awaited operation delays the current request.
- Return `{ ok: true }` to continue or `{ ok: false, error: 'message' }` to stop the flow.
- A hook can be a single async function or an array of async functions.

## Available Hooks

- `show.beforeDatasourceRequest`
- `show.afterDatasourceResponse`
- `list.beforeDatasourceRequest`
- `list.afterDatasourceResponse`
- `create.beforeSave`
- `create.afterSave`
- `edit.beforeSave`
- `edit.afterSave`
- `delete.beforeSave`
- `delete.afterSave`

## Stage Selection

- Use `beforeDatasourceRequest` for read-time scoping, filter changes, or blocking access before the datasource runs.
- Use `afterDatasourceResponse` for reshaping or enriching records after the datasource returns them.
- Use `beforeSave` for checks or data mutations that must happen before create, edit, or delete reaches the database.
- Use `afterSave` only for post-write side effects such as logging, notifications, or sync work. Errors there do not roll back data that already reached the database.

## Show and Edit Behavior

- `show` hooks are also used when AdminForth loads initial data for the edit page.
- Inside `show` hooks, inspect `query.source` on the hook params, not `extra.query`.
- `query.source === 'show'` means the real show page.
- `query.source === 'edit'` means the edit form initial-load flow.

## Example

```ts
hooks: {
	show: {
		afterDatasourceResponse: async ({ query, response }) => {
			if (query.source === 'edit') {
				// runs only when AdminForth loads initial values for the edit page
			} else if (query.source === 'show') {
				// runs only on the real show page
			}

			return { ok: true };
		},
	},
}
```

## Choosing Hooks vs Permissions

- Prefer `adminforth-permissions` for straightforward role-based access control.
- Use hooks when the rule depends on specific record values, incoming filters, mutations, or request lifecycle timing.