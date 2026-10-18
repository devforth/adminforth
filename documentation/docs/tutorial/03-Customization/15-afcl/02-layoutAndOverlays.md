---
description: "Layout and Overlays of the AdminForth Components Library (AFCL) with live examples: VerticalTabs, Card, Page Header, Tooltip, Dialog, Dialog Panel, Dropdown Menu, Modal."
image: "/ogs/afcl.png"
---

import AfclPreview from '@site/src/components/AfclPreview';

# Layout and Overlays

Blocks which lay out a page, and tooltips, menus and dialogs which open over it. Import the components from `@/afcl`, see [AdminForth Components Library](./index.md).

## VerticalTabs

Wrap each tab lable in tamplate with v-slot value `tab:TAB_ALIAS`. Wrap each tab content in tamplate with v-slot value `TAB_ALIAS`. `TAB_ALIAS` is a unique identifier for each tab here. Place all templates inside `VerticalTabs` component.

<AfclPreview id="vertical-tabs">

```js
import { VerticalTabs } from '@/afcl'
import { IconCircleUser, IconLayoutGrid } from '@iconify-prerendered/vue-lucide'
```

```html
<VerticalTabs>
  <template #tab:Profile>
    <IconCircleUser class="w-4 h-4" />
    Profile
  </template>
  <template #tab:Dashboard>
    <IconLayoutGrid class="w-4 h-4" />
    Board
  </template>
  <template #Profile>
    <h3 class="text-base font-semibold mb-2">Profile Tab</h3>
    <p>This is some placeholder content the Profile tab's associated content</p>
  </template>
  <template #Dashboard>
    Dashboard Tab Content
  </template>
</VerticalTabs>
```

</AfclPreview>

### In a card

`tabsClass` and `contentClass` add classes to the column of tabs and to the content, they override the default ones (the margins and the frame of the column). The `tabs-header` slot goes above the tabs. This is how the settings page puts its tabs on a tinted pane of a card:

<AfclPreview id="vertical-tabs-card">

```js
import { VerticalTabs } from '@/afcl'
import { IconLink, IconMonitorSmartphone } from '@iconify-prerendered/vue-lucide'
```

```html
<VerticalTabs
  class="overflow-hidden rounded-xl border border-lightCardBorder bg-lightCardBackground dark:border-darkCardBorder dark:bg-darkCardBackground"
  tabsClass="m-0 md:m-0 md:self-stretch md:w-64 shrink-0 px-3 py-4 rounded-none border-0 border-b md:border-b-0 md:border-e border-lightCardBorder dark:border-darkCardBorder bg-lightVerticalTabsBackground dark:bg-darkVerticalTabsBackground"
  contentClass="p-5 md:ps-6"
>
  <template #tabs-header>
    <p class="px-2.5 pb-3 font-semibold text-lightCardTitle dark:text-darkCardTitle">Settings</p>
  </template>
  <template #tab:accounts>
    <IconLink class="w-4 h-4" />
    Connected accounts
  </template>
  <template #tab:sessions>
    <IconMonitorSmartphone class="w-4 h-4" />
    Active sessions
  </template>
  <template #accounts>
    Connected accounts content
  </template>
  <template #sessions>
    Active sessions content
  </template>
</VerticalTabs>
```

</AfclPreview>

## Card 

Card is a static hairline surface (`afcl-card`) which fills the width of its container, put it into a grid to build dashboards. Classes passed to it override the default ones, e.g. `class="p-2"` replaces the padding.

### Custom card

If you need custom card, you can make it without title and description and put any content into the default slot

<AfclPreview id="card-custom">

```js
import { Card } from '@/afcl'
```

```html
<Card>
  <p class="text-sm text-lightCardDescription dark:text-darkCardDescription">Total Profit</p>
  <p class="mt-1 text-2xl font-semibold text-lightCardTitle dark:text-darkCardTitle">$100,000</p>
</Card>
```

</AfclPreview>

### Standard card

<AfclPreview id="card">

```js
import { Card } from '@/afcl'
```

```html
<div class="flex flex-col gap-4">
  <Card
    title="This is a large card"
    description="Description text for large card. This is a large card. Very nice card. Big one. You can put here any content you want."
  >
  </Card>

  <Card
    size="md"
    title="This is a medium card"
    description="Description text for medium card. This is a medium card. Very nice card. Big one. You can put here any content you want."
  >
  </Card>

  <Card
    size="sm"
    title="This is a small card"
    description="Description text for small card. This is a small card. Very nice card. Big one. You can put here any content you want."
  >
  </Card>
</div>
```

</AfclPreview>

## Page Header

Title of a page or of a section with a description and actions on the right (`afcl-page-header`). The actions wrap under the text on narrow screens. Settings pages of plugins start with it.

<AfclPreview id="page-header">

```js
import { Button, PageHeader } from '@/afcl'
import { IconPlus } from '@iconify-prerendered/vue-lucide'
```

```html
<PageHeader
  title="MCP"
  description="Connect an AI agent to your admin panel. It acts on your behalf with your permissions."
>
  <template #actions>
    <Button>
      <IconPlus class="w-4 h-4" />
      Connect agent
    </Button>
  </template>
</PageHeader>
```

</AfclPreview>

## Tooltip
  
Wrap an element on which you would like to show a tooltip with the `Tooltip` component and add a `tooltip` slot to it.

<AfclPreview id="tooltip" minHeight={100}>

```js
import { Tooltip } from '@/afcl'
import { IconSearch } from '@iconify-prerendered/vue-lucide'
```

```html
<Tooltip>
  <a :href="`https://google.com?q=adminforth`" target="_blank">
    <IconSearch class="w-5 h-5" />
  </a>

  <template #tooltip>
    Search for AdminForth
  </template>
</Tooltip>
```

</AfclPreview>

## Dialog (Pop-up)

<AfclPreview id="dialog" minHeight={300}>

```ts
import { Dialog, Button } from '@/afcl'
```

```html
<Dialog class="w-96">
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

</AfclPreview>

On screens narrower than 640px the dialog docks to the bottom edge as a sheet: it takes the full width, and footer buttons stack with the last one on top. Width classes like `w-96` apply from 640px up.

### Header

You can add header to the dialog by using header prop.

<AfclPreview id="dialog-header" minHeight={300}>

```js
import { Dialog, Button } from '@/afcl'
```

```html
//diff-remove
<Dialog class="w-96">
//diff-add
<Dialog
//diff-add
  class="w-96"
//diff-add
  header="Dialog Header"
//diff-add
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

</AfclPreview>

If you want to remove close button in header, you can add `:header-close-button="false"` prop to `<Dialog>`.

### Buttons

By default dialog will have just one "Close" button. If you want to change that, you can set `buttons` to a desirable array.

<AfclPreview id="dialog-buttons" minHeight={300}>

```ts
import { Dialog, Button } from '@/afcl'
function doSave() {
  console.log('saved');
}
```

```html
<Dialog
  class="w-96"
  header="Dialog Header"
//diff-add
  :buttons="[
//diff-add
    { label: 'Save', onclick: (dialog) => { doSave(); dialog.hide(); } },
//diff-add
    { label: 'Close', onclick: (dialog) => dialog.hide() },
//diff-add
  ]"
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

</AfclPreview>

Dialog component will render each button using afcl `Button` component. You can pass any props to those buttons by adding `options` field to a button item.

<AfclPreview id="dialog-button-options" minHeight={300}>

```ts
import { Dialog, Button } from '@/afcl'
import { ref } from 'vue'

const savingIsAllowed = ref(false)

function doSave() {
  console.log('saved');
}
```

```html
<Dialog
  class="w-96"
  header="Dialog Header"
  :buttons="[
//diff-remove
    { label: 'Save', onclick: (dialog) => { doSave(); dialog.hide(); } },
//diff-add
    {
//diff-add
      label: 'Save',
//diff-add
      options: {
//diff-add
        disabled: !savingIsAllowed,
//diff-add
      },
//diff-add
      onclick: (dialog) => { doSave(); dialog.hide(); },
//diff-add
    },
//diff-remove
    { label: 'Close', onclick: (dialog) => dialog.hide() },
//diff-add
    { label: 'Close', options: { variant: 'secondary' }, onclick: (dialog) => dialog.hide() },
  ]"
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

</AfclPreview>

### Dialog persistence

Default behavior of the Dialog component will allow user to close it by just clicking outside. You can prevent that by setting `closeByClickOutside` to `false`.

<AfclPreview id="dialog-persistence" minHeight={300}>

```js
import { Dialog, Button } from '@/afcl'
```

```html
<Dialog
  class="w-96"
  header="Dialog Header"
//diff-add
  :closeByClickOutside="false"
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

</AfclPreview>

### Programatically open or close dialog

If you want to control dialog programmatically, you can use `ref` to get a reference to the dialog component and call its `open` and `close` methods.

<AfclPreview id="dialog-ref" minHeight={300}>

```ts
import { Button, Dialog } from '@/afcl'
import { ref } from 'vue'

const confirmDialog = ref(null);

function openDialog() {
  confirmDialog.value.open();
}
```

```html
<Button @click="openDialog">Open dialog</Button>

<Dialog ref="confirmDialog" class="w-96">
  <div class="space-y-4">
    The dialog content goes here.
  </div>
</Dialog>
```

</AfclPreview>

### Before open/close dialog handlers

If you want to run custom logic before the dialog opens or closes by passing callback props:

```html
<Dialog 
  class="w-96" 
  :beforeOpenFunction="onBeforeOpen" 
  :beforeCloseFunction="onBeforeClose"
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    <p>This is the first paragraph of dialog content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Dialog>
```

Now you can pass before open/close functions:

```ts
import { Dialog, Button } from '@/afcl'
import { ref } from 'vue'

const counter = ref(0);

function onBeforeOpen() {
  counter.value++;
  console.log(`custom open function called ${counter.value}`);
}

function onBeforeClose() {
  counter.value++;
  console.log(`custom close function called ${counter.value}`);
}
```

### Ask for extra confirmation before close

If you want dialog to ask user for conformation when he tryes to close dialog, you can add: 

<AfclPreview id="dialog-close-confirmation" minHeight={300}>

```js
import { Dialog, Button } from '@/afcl'
```

```html
<Dialog 
  class="w-96"
//diff-add
  :askForCloseConfirmation="true"
//diff-add
  closeConfirmationText="Are you sure you want to close this dialog?"
>
  <template #trigger>
    <Button>Dialog Toggle</Button>
  </template>

  <div class="space-y-4">
    The dialog content goes here.
  </div>
</Dialog>
```

</AfclPreview>

## Dialog Panel

The panel of a dialog drawn right on the page: login, two-factor, password reset and other screens which can't be closed. It has the header, the body and the footer band of a dialog, but no backdrop, and it is drawn like other surfaces, with a hairline border and a light shadow. A panel shown over the page in your own overlay takes `class="shadow-popover dark:shadow-darkPopover"`.

<AfclPreview id="dialog-panel">

```js
import { DialogPanel, Input, Button } from '@/afcl'
import { IconLock } from '@iconify-prerendered/vue-lucide'
```

```html
<DialogPanel title="Reset password" subtitle="We will send a link to your email">
  <template #icon><IconLock /></template>
  <Input type="email" fullWidth placeholder="name@company.com" />
  <template #footer>
    <Button variant="secondary">Back to login</Button>
    <Button>Send reset link</Button>
  </template>
</DialogPanel>
```

</AfclPreview>

`error` shows a message under the body:

<AfclPreview id="dialog-panel-error">

```js
import { DialogPanel, Input } from '@/afcl'
```

```html
<DialogPanel title="Set new password" error="Passwords do not match">
  <Input type="password" passwordToggle invalid fullWidth modelValue="secret" />
</DialogPanel>
```

</AfclPreview>

Props:

```ts
  title?: string
  subtitle?: string
  error?: string | null
  closable?: boolean // a close button in the header which emits close
  // extra classes for the parts: header, icon, titleWrap, title, subtitle, close, body, error, footer
  classes?: Partial<Record<DialogPanelPart, ClassNameValue>>
```

Slots: `icon` for the tile left of the title, `title` to replace the title and the subtitle with your own content, the default slot for the body and `footer` for the actions. The main action goes last, so it ends up on the right.

## Dropdown Menu

A menu opened by a click on its trigger. Put the trigger into the `trigger` slot and menu items into the default slot.

<AfclPreview id="dropdown-menu" minHeight={220}>

```js
import { DropdownMenu, DropdownMenuItem, Button } from '@/afcl'
import { IconPencil, IconTrash2 } from '@iconify-prerendered/vue-lucide'
```

```html
<DropdownMenu>
  <template #trigger>
    <Button variant="secondary">Actions</Button>
  </template>

  <DropdownMenuItem @click="edit">
    <template #icon><IconPencil /></template>
    Edit
  </DropdownMenuItem>
  <DropdownMenuItem to="/resource/cars">
    All cars
  </DropdownMenuItem>
  <DropdownMenuItem danger @click="remove">
    <template #icon><IconTrash2 /></template>
    Delete
  </DropdownMenuItem>
</DropdownMenu>
```

</AfclPreview>

The menu closes after a click on an item, on a click outside and on `Esc`.

`DropdownMenuItem` props:

```ts
  to?: RouteLocationRaw // renders the item as a router link
  disabled?: boolean
  danger?: boolean // colors the item as a destructive action
```

Besides the default slot, an item has the `icon` slot (rendered before the label) and the `suffix` slot (pushed to the right edge, e.g. for a shortcut or a chevron).

### Placement

`placement` sets the side of the trigger where the menu opens: `bottom-start` (default), `bottom-end`, `left-start` or `right-start`. If the menu does not fit into the viewport, it opens on the opposite side.

```html
<DropdownMenu placement="bottom-end">
```

A `DropdownMenu` rendered inside an item of another menu works as a submenu: a click on its trigger keeps the parent menu open. Use `left-start` or `right-start` placement for it.

### Open state

Bind `v-model:open` to read or change the open state, or call `open()`, `close()` and `toggle()` on a template ref. The `trigger` slot gets `open`, the default slot gets the `close` function:

<AfclPreview id="dropdown-menu-open-state" minHeight={170}>

```ts
import { DropdownMenu, Button } from '@/afcl'
import { ref } from 'vue'
import { IconChevronDown } from '@iconify-prerendered/vue-lucide'

const isMenuOpen = ref(false)

function applyColumns() {
  console.log('columns applied')
}
```

```html
<DropdownMenu v-model:open="isMenuOpen">
  <template #trigger="{ open }">
    <Button variant="secondary">
      Columns
      <IconChevronDown class="w-4 h-4" :class="{ 'rotate-180': open }" />
    </Button>
  </template>

  <template #default="{ close }">
    <div class="p-2">
      <Button class="w-full" @click="applyColumns(); close()">Apply</Button>
    </div>
  </template>
</DropdownMenu>
```

</AfclPreview>

With `:closeOnSelect="false"` a click on an item does not close the menu, close it yourself when the work is done.

### Keep content mounted

By default the menu content is rendered only while the menu is open. Pass `keepMounted` to keep it in the DOM while the menu is closed, for example when items open dialogs or hold state:

```html
<DropdownMenu keepMounted>
```

### Menu inside a scroll container

Inside a table or another container with `overflow` the menu gets clipped. Pass `teleportToBody` to render it in `<body>` with fixed positioning. Such menu closes when the page scrolls or the window is resized.

```html
<DropdownMenu teleportToBody placement="bottom-end">
```

### Accordion

`DropdownMenuAccordion` is a row which expands its items in place, under itself, e.g. Settings and the language in the user menu. A click on the row does not close the menu, `v-model:open` holds its state. Put the items into the default slot and an optional icon into the `icon` slot, `triggerClass` adds classes to the row.

<AfclPreview id="dropdown-menu-accordion" minHeight={300}>

```js
import { DropdownMenu, DropdownMenuItem, DropdownMenuAccordion, Button } from '@/afcl'
import { IconMonitor, IconLink } from '@iconify-prerendered/vue-lucide'
```

```html
<DropdownMenu>
  <template #trigger>
    <Button variant="secondary">Account</Button>
  </template>

  <DropdownMenuAccordion label="Settings">
    <DropdownMenuItem @click="openSessions">
      <template #icon><IconMonitor /></template>
      Active sessions
    </DropdownMenuItem>
    <DropdownMenuItem @click="openAccounts">
      <template #icon><IconLink /></template>
      Connected accounts
    </DropdownMenuItem>
  </DropdownMenuAccordion>
</DropdownMenu>
```

</AfclPreview>

`DropdownMenuItem` has the `keepMenuOpen` prop for other rows which must not close the menu on click.

## Modal

<AfclPreview id="modal" minHeight={260}>

```ts
import { Modal, Button } from '@/afcl';
```

```html
<Modal class="w-96" :closeByClickOutside="true" :closeByEsc="true" askForCloseConfirmation>
  <template #trigger>
    <Button>Modal Toggle</Button>
  </template>

  <div class="space-y-4 p-4">
    <p>This is the first paragraph of modal content.</p>
    <p>And this is the second paragraph.</p>
  </div>
</Modal>
```

</AfclPreview>

Like Dialog, the modal docks to the bottom edge as a full-width sheet on screens narrower than 640px.

### Open state

Bind `v-model:open` to open or close the modal from code, for example to show progress while a request is running:

<AfclPreview id="modal-open-state" minHeight={160}>

```ts
import { ref } from 'vue'
import { Modal, Button, Spinner } from '@/afcl';

const isSaving = ref(false)

function save() {
  isSaving.value = true
  setTimeout(() => { isSaving.value = false }, 2000) // a request instead in real app
}
```

```html
<Button @click="save">Save</Button>

<Modal v-model:open="isSaving" :closeByClickOutside="false" :closeByEsc="false">
  <div class="flex items-center gap-3 px-5 py-4">
    <Spinner class="w-5 h-5" />
    Saving...
  </div>
</Modal>
```

</AfclPreview>

### Props: 
```ts
  closeByClickOutside?: boolean  // Close on click outside of modal (default is true)
  closeByEsc?: boolean // Close on Esc button click (default is true)
  beforeCloseFunction?: (() => void | Promise<void>) | null // Callback, that will be executed before open
  beforeOpenFunction?: (() => void | Promise<void>) | null // Callback, that will be executed before close
  askForCloseConfirmation?: boolean // Show extra popup to confirm close ( to avoid close by accident)
  closeConfirmationText?: string // Text that will be shown on close confirmation popup
  removeFromDomOnClose?: boolean // Remove modal from DOM on close ( default is false )
  backgroundCustomClasses?: string // allows to add custom classes to the gray background of modal (e.g. you can have bg-pink-500/60)
  modalCustomClasses?: string // allows to add custom classes to modal popup
```
