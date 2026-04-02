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
          logger.info("auto submit", recordId, adminUser);
          return { 
            ok: true, 
            successMessage: "Auto submitted" 
          };
        },

        // Configure where the action appears
        showIn: {
          list: false,             // Show in list view
          listThreeDotsMenu: true, // Show in three dots menu in list view
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
- `action`: Handler function that executes when action is triggered for a **single** record
- `bulkHandler`: Handler function that executes when the action is triggered for **multiple** records at once (see [Bulk button with bulkHandler](#bulk-button-with-bulkhandler))
- `showIn`: Controls where the action appears
  - `list`: whether to show as an icon button per row in the list view
  - `listThreeDotsMenu`: whether to show in the three-dots menu per row in the list view
  - `showButton`: whether to show as a button on the show view
  - `showThreeDotsMenu`: whether to show in the three-dots menu of the show view
  - `bulkButton`: whether to show as a bulk action button when rows are selected

### Bulk button with `action`

When `showIn.bulkButton` is `true` and only `action` (not `bulkHandler`) is defined, AdminForth automatically calls your `action` function **once per selected record** using `Promise.all`. This is convenient for simple cases but means N separate handler invocations run in parallel:

```ts title="./resources/apartments.ts"
{
  name: 'Auto submit',
  action: async ({ recordId }) => {
    // Called once per selected record when used as a bulk button
    await doSomething(recordId);
    return { ok: true, successMessage: 'Done' };
  },
  showIn: {
    bulkButton: true,   // triggers Promise.all over selected records
    showButton: true,
  }
}
```

If your operation can be expressed more efficiently as a single batched query (e.g., a single `UPDATE … WHERE id IN (…)`), define `bulkHandler` instead. AdminForth will call it **once** with all selected record IDs:

```ts title="./resources/apartments.ts"
{
  name: 'Auto submit',
  // bulkHandler receives all recordIds in one call – use it for batched operations
  bulkHandler: async ({ recordIds, adminforth, resource }) => {
    await doSomethingBatch(recordIds);
    return { ok: true, successMessage: `Processed ${recordIds.length} records` };
  },
  // You can still keep `action` for the single-record show/edit buttons
  action: async ({ recordId }) => {
    await doSomething(recordId);
    return { ok: true, successMessage: 'Done' };
  },
  showIn: {
    bulkButton: true,
    showButton: true,
  }
}
```

> ☝️ When both `action` and `bulkHandler` are defined, AdminForth uses `bulkHandler` for bulk operations and `action` for single-record operations. When only `action` is defined and `bulkButton` is enabled, AdminForth falls back to `Promise.all` over individual `action` calls.

### Bulk-specific options

| Option | Type | Description |
|---|---|---|
| `showIn.bulkButton` | `boolean` | Show as a bulk action button in the list toolbar. |
| `bulkHandler` | `async ({ recordIds, adminUser, adminforth, resource, response, tr }) => { ok, error?, message? }` | Called with all selected IDs at once. Falls back to calling `action` per record in parallel if omitted. |
| `bulkConfirmationMessage` | `string` | Confirmation dialog text shown before the bulk action executes. |
| `bulkSuccessMessage` | `string` | Success message shown after the bulk operation. Defaults to `"N out of M items processed successfully"`. |

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
- A string with an error message to explain why access was denied — e.g. `return 'Only superadmins can perform this action'`

Here is how it looks:
![alt text](<Single record actions.png>)

### Action URL

Instead of defining an `action` handler, you can specify a `url` that the user will be redirected to when clicking the action button:

```ts title="./resources/apartments.ts"
{
  name: 'View details',
  icon: 'flowbite:eye-solid',
  url: '/resource/aparts',  // URL to redirect to
  showIn: {
    list: true,
    listThreeDotsMenu: false,
    showButton: true,
    showThreeDotsMenu: true,
  } 
}
```

The URL can be:
- A relative path within your admin panel (starting with '/')
- An absolute URL (starting with 'http://' or 'https://')

To open the URL in a new tab, append `target=_blank` as a query parameter. If the URL already has query parameters, use `&target=_blank`; otherwise use `?target=_blank`:

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

## Custom Component

If you want to style an action's button/icon without changing its behavior, attach a custom UI wrapper via `customComponent`. 
The file points to your SFC in the custom folder (alias `@@/`), and `meta` lets you pass lightweight styling options (e.g., border color, radius).

Below we wrap a "Mark as listed" action.

```ts title="./resources/apartments.ts"
{
  resourceId: 'aparts',
  options: {
    actions: [
      {
        name: 'Mark as listed',
        icon: 'flowbite:eye-solid',
        // UI wrapper for the built-in action button
        //diff-add
        customComponent: {
          //diff-add
          file: '@@/ActionBorder.vue',        // SFC path in your custom folder
          //diff-add
          meta: { color: '#94a3b8', radius: 10 }
          //diff-add
        },
        showIn: { list: false, listThreeDotsMenu: true, showButton: true, showThreeDotsMenu: true },
        action: async ({ recordId }) => {
          await admin.resource('aparts').update(recordId, { listed: 1 });
          return { ok: true, successMessage: 'Marked as listed' };
        }
      },
    ]
  }
}
```

Use this minimal wrapper component to add a border/rounding around the default action UI while keeping the action logic intact. 
Keep the `<slot />` (that's where AdminForth renders the default button) and emit `callAction` (optionally with a payload) to trigger the handler when the wrapper is clicked.

```ts title="./custom/ActionBorder.vue"
<template>
  <!-- Keep the slot: AdminForth renders the default action button/icon here -->
  <!-- Emit `callAction` (optionally with a payload) to trigger the action when the wrapper is clicked -->
  <!-- Example: provide `meta.extra` to send custom data. In list views we merge with `row` so recordId context is kept. -->
  <div :style="styleObj" @click="emit('callAction', { ...props.row, ...(props.meta?.extra ?? {}) })">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  // meta can style the wrapper and optionally carry extra payload for the action
  meta?: { color?: string; radius?: number; padding?: number; extra?: any };
  // When used in list view, the table passes current row
  row?: any;
  // When used in show/edit views, the page passes current record
  record?: any;
}>();
const emit = defineEmits<{ (e: 'callAction', payload?: any): void }>();

const styleObj = computed(() => ({
  display: 'inline-block',
  border: `1px solid ${props.meta?.color ?? '#e5e7eb'}`,
  borderRadius: (props.meta?.radius ?? 8) + 'px',
  padding: (props.meta?.padding ?? 2) + 'px',
}));
</script>
```

### Pass dynamic values to the action

You can pass arbitrary data from your custom UI wrapper to the backend action by emitting `callAction` with a payload. That payload will be available on the server under the `extra` argument of your action handler.

Frontend examples:

```vue title="./custom/ActionToggleListed.vue"
<template>
  <!-- Two buttons that pass different flags to the action -->
  <button @click="emit('callAction', { asListed: true })" class="mr-2">Mark as listed</button>
  <button @click="emit('callAction', { asListed: false })">Mark as unlisted</button>

  <!-- Or keep the default slot button and wrap it: -->
  <div @click="emit('callAction', { asListed: true })">
    <slot />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'callAction', payload?: any): void }>();
</script>
```

Backend handler: read the payload via `extra`.

```ts title="./resources/apartments.ts"
{
  resourceId: 'aparts',
  options: {
    actions: [
      {
        name: 'Toggle listed',
        icon: 'flowbite:eye-solid',
        showIn: { list: false, listThreeDotsMenu: false, showButton: true, showThreeDotsMenu: true },
        // The payload from emit('callAction', { asListed: true|false }) arrives here as `extra`
        customComponent: {
          file: '@@/ActionToggleListed.vue'
        },
        action: async ({ recordId, extra }) => {
          const asListed = extra?.asListed === true;
          // Example update (use your own data layer):
          await admin.resource('aparts').update(recordId, { listed: asListed });
          return { ok: true, successMessage: `Set listed=${asListed}` };
        }
      }
    ]
  }
}
```

Notes:
- If you don’t emit a payload, the default behavior is used by the UI (e.g., in lists the current row context is used). When you do provide a payload, it will be forwarded to the backend as `extra` for your action handler.
- You can combine default context with your own payload by merging before emitting, for example: `emit('callAction', { ...row, asListed: true })` if your component has access to the row object.