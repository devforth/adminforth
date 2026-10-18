---
description: "Reference page for the AdminForth Components Library, covering reusable UI components such as buttons, links, badges, inputs, tables, and other building blocks."
image: "/ogs/afcl.png"  # Path to the OG image
---

import AfclPreview from '@site/src/components/AfclPreview';

# AdminForth Components Library

AFCL is a set of components which you can use as build blocks in your AdminForth application. 
AFCL allows to keep the design consistent with minimal efforts and build new pages faster.
AFCL components follow styling standard and respect theme colors.

Components set is always growing, so you can expect new components to be added in the future.

Examples on this page are live: each of them renders the code below it with real AFCL components and the default theme.

## Button

<AfclPreview id="button">

```js
import { Button } from '@/afcl'
```

```html
<div class="flex flex-wrap gap-3">
  <Button @click="doSmth">
    Your button text
  </Button>
  <Button @click="doSmth" :loader="true">
    Your button text
  </Button>
</div>
```

</AfclPreview>

loader prop would show loader when it's true.

### Variant

The `variant` prop controls the button style. Possible values are `primary` (default), `secondary`, `danger` and `ghost`. A `ghost` button has no border and no background until hover, use it for quiet actions like icons in table rows.

<AfclPreview id="button-variant">

```html
<div class="flex flex-wrap gap-3">
  <Button @click="doSmth">
    Primary button
  </Button>
  <Button @click="doSmth" variant="secondary">
    Secondary button
  </Button>
  <Button @click="doSmth" variant="danger">
    Danger button
  </Button>
  <Button @click="doSmth" variant="ghost">
    Ghost button
  </Button>
</div>
```

</AfclPreview>

> ☝️ The `mode` prop is deprecated, use `variant` instead.

### Size

The `size` prop is `md` (default, 34px high) or `sm` (28px high).

<AfclPreview id="button-size">

```html
<div class="flex flex-wrap items-center gap-3">
  <Button variant="secondary">
    Medium button
  </Button>
  <Button variant="secondary" size="sm">
    Small button
  </Button>
</div>
```

</AfclPreview>

### Icon only

`iconOnly` makes a square button for one icon from the slot and sizes the icon to 16px. With `loader` the spinner takes the place of the icon.

<AfclPreview id="button-icon-only">

```js
import { IconCheck, IconX, IconPencil, IconTrash2 } from '@iconify-prerendered/vue-lucide'
```

```html
<div class="flex flex-wrap items-center gap-3">
  <Button iconOnly>
    <IconCheck />
  </Button>
  <Button variant="secondary" iconOnly>
    <IconX />
  </Button>
  <Button iconOnly :loader="true">
    <IconCheck />
  </Button>
  <Button variant="ghost" size="sm" iconOnly>
    <IconPencil />
  </Button>
  <Button variant="ghost" size="sm" iconOnly>
    <IconTrash2 />
  </Button>
</div>
```

</AfclPreview>

## Button Group

### With active button

<AfclPreview id="button-group">

```ts
import { ref } from 'vue'
import { ButtonGroup } from '@/afcl'
import { IconCircleUser, IconLayoutGrid } from '@iconify-prerendered/vue-lucide'

const activeButton = ref('Profile')
```

```html
<ButtonGroup v-model="activeButton">
  <template #button:Profile>
    <div class="flex items-center gap-2 px-4 py-2">
      <IconCircleUser class="w-4 h-4" />
      Profile
    </div>
  </template>
  <template #button:Dashboard>
    <div class="flex items-center gap-2 px-4 py-2">
      <IconLayoutGrid class="w-4 h-4" />
      Board
    </div>
  </template>
</ButtonGroup>
```

</AfclPreview>

### With solid color

<AfclPreview id="button-group-solid">

```ts
import { ButtonGroup } from '@/afcl'
import { IconPlus, IconChevronDown } from '@iconify-prerendered/vue-lucide'
```

```html
<ButtonGroup :solidColor="true">
  <template #button:Add>
    <div class="flex items-center gap-2 px-4 py-2">
      <IconPlus class="w-4 h-4" />
      Add Local Passkey
    </div>
  </template>
  <template #button:Dropdown>
    <div class="flex items-center px-2 py-2">
      <IconChevronDown class="w-4 h-4" />
    </div>
  </template>
</ButtonGroup>
```

</AfclPreview>

## Link

<AfclPreview id="link">

```js
import { Link } from '@/afcl'
```

```html
<Link to="/login">Go to login</Link>
```

</AfclPreview>

## LinkButton

Looks like button but works like link. Uses `router-link` under the hood. Takes the same `variant`, `size` and `iconOnly` props as `Button`.

<AfclPreview id="link-button">

```js
import { LinkButton } from '@/afcl'
```

```html
<LinkButton to="/login">Go to login</LinkButton>
```

</AfclPreview>

## Select

### Single

<AfclPreview id="select" minHeight={250}>

```ts
import { ref } from 'vue'
import { Select } from '@/afcl'

const selected = ref(null)
```

```html
<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
    {label: 'None', value: null}
  ]"
  v-model="selected"
></Select>
```

</AfclPreview>

### Multiple

<AfclPreview id="select-multiple" minHeight={250}>

```ts
import { ref } from 'vue'

//diff-remove
const selected = ref(null)
//diff-add
const selected = ref([])
```

```html
<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
    {label: 'None', value: null}
  ]"
  v-model="selected"
//diff-add
  multiple
></Select>
```

</AfclPreview>

### Custom slots for item

You can customize item and selected item using slots.

<AfclPreview id="select-custom-item" minHeight={250}>

```ts
import { ref } from 'vue'

const selected = ref(null)
```

```html
<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7', records: 110},
    {label: 'Last 30 days', value: '30', records: 320},
    {label: 'Last 90 days', value: '90', records: 310},
    {label: 'None', value: null}
  ]"
  v-model="selected"
>
//diff-add
  <template #item="{option}">
//diff-add
    <div>
//diff-add
      <span>{{ option.label }}</span>
//diff-add
      <span class="ml-2 opacity-50">{{ option.records }} records</span>
//diff-add
    </div>
//diff-add
  </template>
//diff-add
  <template #selected-item="{option}">
//diff-add
    <span>{{ option.label }} 💫</span>
//diff-add
  </template>
</Select>
```

</AfclPreview>

### Extra item

You might need to put some extra item at bottom of list

<AfclPreview id="select-extra-item" minHeight={250}>

```ts
import { ref } from 'vue'

const selected = ref(null)
```

```html
<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
  ]"
  v-model="selected"
>
//diff-add
  <template #extra-item>
//diff-add
    <LinkButton to="/ranges">Manage ranges</LinkButton>
//diff-add
  </template>
</Select>
```

</AfclPreview>

### Add classes to the input directly

Pass `classesForInput` to style the input of the select.

<AfclPreview id="select-input-classes" minHeight={250}>

```ts
import { ref } from 'vue'

const selected = ref(null)
```

```html
<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7'}, 
    {label: 'Last 30 days', value: '30'}, 
    {label: 'Last 90 days', value: '90'},
  ]"
  v-model="selected"
//diff-add
  classesForInput="py-[4px] text-sm bg-white rounded"
></Select>
```

</AfclPreview>

## Input

<AfclPreview id="input">

```js
import { Input } from '@/afcl'
```

```html
<Input type="number" class="w-full">
  <template #suffix>
    USD
  </template>
</Input>
```

</AfclPreview>

<AfclPreview id="input-right-icon">

```js
import { Input } from '@/afcl'
import { IconSearch } from '@iconify-prerendered/vue-lucide'
```

```html
<Input type="text" class="w-full">
  <template #rightIcon>
    <IconSearch class="w-4 h-4 text-lightInputIconColor dark:text-darkInputIconColor" />
  </template>
</Input>
```

</AfclPreview>

## Textarea

<AfclPreview id="textarea">

```ts
import { ref } from 'vue'
import { Textarea } from '@/afcl'

const textAreaInput = ref('')
```

```html
<Textarea
  v-model="textAreaInput"
  placeholder="Enter some text..."
  class="w-64"
/>
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

`tabsClass` and `contentClass` add classes to the column of tabs and to the content, they override the default ones (the margins of the column, the padding and the divider of the content). The `tabs-header` slot goes above the tabs. This is how the settings page puts its tabs on a tinted pane of a card:

<AfclPreview id="vertical-tabs-card">

```js
import { VerticalTabs } from '@/afcl'
import { IconLink, IconMonitorSmartphone } from '@iconify-prerendered/vue-lucide'
```

```html
<VerticalTabs
  class="overflow-hidden rounded-xl border border-lightCardBorder bg-lightCardBackground dark:border-darkCardBorder dark:bg-darkCardBackground"
  tabsClass="m-0 md:m-0 md:w-64 px-3 py-4 border-b md:border-b-0 md:border-e border-lightCardBorder dark:border-darkCardBorder bg-lightVerticalTabsBackground dark:bg-darkVerticalTabsBackground"
  contentClass="p-5 md:ps-6 md:border-s-0"
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

## Checkbox

<AfclPreview id="checkbox">

```ts
import { ref } from 'vue'
import { Checkbox } from '@/afcl'

const enable = ref(false)
```

```html
<Checkbox v-model="enable">
  Enable
</Checkbox>
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

## Toggle

<AfclPreview id="toggle">

```ts
import { ref } from 'vue'
import { Toggle } from '@/afcl'

const enabled = ref(false)
```

```html
<Toggle v-model="enabled" :disabled="false">
  <p>Click me</p>
</Toggle>
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

## Dropzone

<AfclPreview id="dropzone">

```ts
import { ref, watch } from 'vue'
import { Dropzone } from '@/afcl'

const files = ref<File[]>([])

watch(files, (files) => {
  console.log('files selected', files);
})
```

```html
<Dropzone
  :extensions="['.jpg', '.jpeg', '.png']"
  :maxSizeBytes="1024 * 1024 * 2"
  :multiple="false"
  v-model="files"
/>
```

</AfclPreview>

## Table

<AfclPreview id="table">

```ts
import { Table } from '@/afcl'
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'UK' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
></Table>
```

</AfclPreview>

### No even highlights

<AfclPreview id="table-no-even-highlights">

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'UK' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
//diff-add
  :evenHighlights="false"
></Table>
```

</AfclPreview>

### Custom cell

<AfclPreview id="table-custom-cell">

```ts
const isoFlagToEmoji = (iso) => iso.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'BR' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
>
//diff-add
  <template #cell:country="{item}">
//diff-add
    {{ isoFlagToEmoji(item.country) }}
//diff-add
  </template>
</Table>
```

</AfclPreview>

### Custom header

<AfclPreview id="table-custom-header">

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'BR' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
>
//diff-add
  <template #header:country>
//diff-add
    🌍 Geo
//diff-add
  </template>
</Table>
```

</AfclPreview>

### Pagination

Table provides front-end side pagination. You can set `pageSize` (default is 5) to set how many rows to show per page.
If there is less then `pageSize` rows, pagination will not be shown.

<AfclPreview id="table-pagination">

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'BR' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
//diff-add
  :pageSize="3"
>
</Table>
```

</AfclPreview>

### Server-side pagination

To load pages dynamically, simply pass async callback to data:

<AfclPreview id="table-server-pagination">

```ts
async function loadPageData(data) {  
  const { offset, limit } = data;
  // in real app do await callAdminForthApi or await fetch to get date, use offset and limit value to slice data
  return {
    data: [
      { name: 'John', age: offset, country: 'US' },
      { name: 'Rick', age: offset+1, country: 'CA' },
      { name: 'Alice', age: offset+2, country: 'BR' },
    ],
    total: 9 // should return total amount of records in database
  }
}
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
//diff-add
  :data="loadPageData"
  :pageSize="3"> 
</Table>
```

</AfclPreview>

> 👆 The page size is used as the limit for pagination.

### Sorting

Table supports column sorting out of the box.

- By default, columns are NOT sortable. Enable sorting per column with `sortable: true`.
- Clicking a sortable header cycles sorting in a tri-state order:
  - none → ascending → descending → none
  - When it returns to "none", the sorting is cleared.

Basic example (client-side sorting when `data` is an array):

<AfclPreview id="table-sorting">

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name', sortable: true },
    { label: 'Age', fieldName: 'age', sortable: true },
    // disable sort for a specific column
    { label: 'Country', fieldName: 'country', sortable: false },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'BR' },
    { name: 'Colin', age: 40, country: 'AU' },
  ]"
  :pageSize="3"
/>
```

</AfclPreview>

You can also predefine a default sort:

<AfclPreview id="table-default-sort">

```ts
const rows = [
  { name: 'John', age: 30, country: 'US' },
  { name: 'Rick', age: 25, country: 'CA' },
  { name: 'Alice', age: 35, country: 'BR' },
];
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name', sortable: true },
    { label: 'Age', fieldName: 'age', sortable: true },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="rows"
  defaultSortField="age"
  defaultSortDirection="desc"
/>
```

</AfclPreview>

Notes:
- Client-side sorting supports nested field paths using dot-notation, e.g. `user.name`.
- When a column is not currently sorted, a subtle double-arrow icon is shown; arrows switch up/down for ascending/descending.

#### Nested field path sorting

You can sort by nested properties of objects in rows using dot-notation in `fieldName`.

Example:

<AfclPreview id="table-nested-sort">

```html
<Table
  :columns="[
    { label: 'User Name', fieldName: 'user.name', sortable: true },
    { label: 'User Email', fieldName: 'user.email', sortable: true },
    { label: 'City', fieldName: 'user.address.city', sortable: true },
    { label: 'Country', fieldName: 'user.address.country' },
  ]"
  :data="[
    { user: { name: 'Alice', email: 'alice@example.com', address: { city: 'Berlin', country: 'DE' } } },
    { user: { name: 'Bob', email: 'bob@example.com', address: { city: 'Paris', country: 'FR' } } },
    { user: { name: 'Carlos', email: 'carlos@example.com', address: { city: 'Madrid', country: 'ES' } } },
    { user: { name: 'Dana', email: 'dana@example.com', address: { city: 'Rome', country: 'IT' } } },
    { user: { name: 'Eve', email: 'eve@example.com', address: { city: null, country: 'US' } } },
  ]"
  :pageSize="3"
/>
```

</AfclPreview>

Behavior details:
- The path is split on dots and resolved step by step: `user.address.city`.
- Missing or `null` nested values are pushed to the bottom for ascending order (and top for descending) because `null/undefined` are treated as greater than defined values in asc ordering.
- Works the same for client-side sorting and for server-side loaders: when using an async loader the same `sortField` (e.g. `user.address.city`) is passed so you can implement equivalent ordering on the backend.
- Date objects at nested paths are detected and compared chronologically.
- Numeric comparison is stable for mixed numeric strings via Intl.Collator with numeric option.

Edge cases to consider in your own data:
- Deeply missing branches like `user.profile.settings.locale` simply result in `undefined` and will follow the null ordering logic above.
- Arrays are not traversed; if you need array-specific sorting you should pre-normalize data into scalar fields before passing to the table.

### Server-side sorting

When you provide an async function to `data`, the table will pass the current sort along with pagination params.

Signature of the loader receives:

```ts
type LoaderArgs = {
  offset: number;
  limit: number;
  sortField?: string; // undefined when unsorted
  sortDirection?: 'asc' | 'desc'; // only when sortField is set
}
```

Example using `fetch`:

```ts
async function loadPageData({ offset, limit, sortField, sortDirection }) {
  const url = new URL('/api/products', window.location.origin);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(limit));
  if (sortField) url.searchParams.set('sortField', sortField);
  if (sortField && sortDirection) url.searchParams.set('sortDirection', sortDirection);

  const { data, total } = await (await fetch(url)).json();
  return { data, total };
}

<Table
  :columns="[
    { label: 'ID', fieldName: 'id' },
    { label: 'Title', fieldName: 'title' },
    { label: 'Price', fieldName: 'price' },
  ]"
  :data="loadPageData"
  :pageSize="10"
/>
```

Events you can listen to:

```html
<Table
  :columns="columns"
  :data="loadPageData"
  @update:sortField="(f) => currentSortField = f"
  @update:sortDirection="(d) => currentSortDirection = d"
  @sort-change="({ field, direction }) => console.log('sort changed', field, direction)"
/>
```

### Table loading states

For tables where you load data externally and pass them to `data` prop as array (including case with front-end pagination) you might want to show skeleton loaders in table externaly using `isLoading` props.

For tables with server-side paganation which use async function in data prop you can listen for `@update:tableLoading` to get table internal loading state, in other words this event will let you know when server side function started and finished execution, so you might use it e.g. to disable some external filter buttons and so on.

<AfclPreview id="table-loading">

```ts
import { ref } from 'vue'
import { Table, Button } from '@/afcl'

const isTableLoading = ref(false);
const tableState = ref('loading');

async function loadPageData({ offset }) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate network delay
  return {
    data: [
      { name: 'John', age: offset, country: 'US' },
      { name: 'Rick', age: offset + 1, country: 'CA' },
      { name: 'Alice', age: offset + 2, country: 'BR' },
    ],
    total: 9,
  };
}
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="loadPageData" 
//diff-add
  :isLoading="isTableLoading"
  :pageSize="3"
//diff-add
  @update:tableLoading="(loading) => tableState = loading ? 'loading' : 'loaded'"
>
</Table>

<p class="my-3">Table state: {{ tableState }}</p>

<Button @click="isTableLoading = !isTableLoading">Toggle loading state</Button>
```

</AfclPreview>

### Making header and pagination sticky

If you want to make table header or pagination sticky, you can add `makeHeaderSticky`, `makePaginationSticky`

<AfclPreview id="table-sticky">

```html
<Table
  class="min-h-[200px] max-h-[250px]"
  makeHeaderSticky
  makePaginationSticky
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="[
    { name: 'John', age: 30, country: 'US' },
    { name: 'Rick', age: 25, country: 'CA' },
    { name: 'Alice', age: 35, country: 'UK' },
    { name: 'Colin', age: 40, country: 'AU' },
    { name: 'Dana', age: 28, country: 'IT' },
    { name: 'Eve', age: 33, country: 'DE' },
  ]"
></Table>
```

</AfclPreview>

### Don't block pagination on loading

Sometimes you might want to allow user switch between pages, even if old request wasn't finished. For these porpuses you can use `blockPaginationOnLoading` and `abortSignal` in data callback:

<AfclPreview id="table-non-blocking-pagination">

```ts
async function loadPageData(data, abortSignal) {  
  const { offset, limit } = data;
  // in real app do await callAdminForthApi or await fetch to get date, use offset and limit value to slice data
  await new Promise(resolve => setTimeout(resolve, 500)) // simulate network delay
  if (abortSignal.aborted) return; // since result won't be displayed, we stop computing
  
  return {
    data: [
      { name: 'John', age: offset, country: 'US' },
      { name: 'Rick', age: offset+1, country: 'CA' },
      { name: 'Alice', age: offset+2, country: 'BR' },
    ],
    total: 30 // should return total amount of records in database
  }
}
```

```html
<Table
  :columns="[
    { label: 'Name', fieldName: 'name' },
    { label: 'Age', fieldName: 'age' },
    { label: 'Country', fieldName: 'country' },
  ]"
  :data="loadPageData"
//diff-add
  :blockPaginationOnLoading="false"
  :pageSize="3"> 
</Table>
```

</AfclPreview>

## ProgressBar

<AfclPreview id="progress-bar">

```js
import { ProgressBar } from '@/afcl'
```

```html
<ProgressBar
  :currentValue="2600"
  :minValue="0"
  :maxValue="5000"
/>
```

</AfclPreview>

### Custom labels

Custom labels in the ProgressBar component allow you to customize the text displayed on the left and right sides of the progress bar. You can also customize the format of the value and the progress text.

<AfclPreview id="progress-bar-labels">

```html
<ProgressBar
  :currentValue="1070"
  :minValue="0"
  :maxValue="5000"
  :leftLabel="'Level 2'"
  :rightLabel="'Level 3'"
  :formatter="(value: number) => `${value} points`"
  :progressFormatter="(value: number, percentage: number) => `${value} done`"
/>
```

</AfclPreview>

### Show progress animation

<AfclPreview id="progress-bar-animation">

```html
<ProgressBar
  :currentValue="2600"
  :minValue="0"
  :maxValue="5000"
  showAnimation
/>
```

</AfclPreview>

### Change height of the progress bar

<AfclPreview id="progress-bar-height">

```html
<ProgressBar
  :currentValue="2600"
  :minValue="0"
  :maxValue="5000"
  :height="6"
/>
```

</AfclPreview>

## Skeleton

Skeleton component is used to display a loading state for a component. You can use prop `type` to set the type of the skeleton.

<AfclPreview id="skeleton">

```js
import { Skeleton } from '@/afcl'
```

```html
<div class="flex flex-col gap-2">
  <Skeleton class="w-full h-4" />
  <Skeleton class="w-full h-2" />
  <Skeleton class="w-full h-2" />
  <Skeleton class="w-full h-2" />
  <Skeleton class="w-full h-2" />
</div>
```

</AfclPreview>

### Skeleton image

<AfclPreview id="skeleton-image">

```html
<Skeleton type="image" class="w-full h-40" />
```

</AfclPreview>

### Skeleton input

<AfclPreview id="skeleton-input">

```html
<div class="flex flex-col gap-2">
  <Skeleton type="input" class="w-full h-4" />
  <Skeleton type="input" class="w-full h-2" />
  <Skeleton type="input" class="w-full h-2" />
  <Skeleton type="input" class="w-full h-2" />
  <Skeleton type="input" class="w-full h-2" />
</div>
```

</AfclPreview>

### Skeleton video

<AfclPreview id="skeleton-video">

```html
<Skeleton type="video" class="w-full h-40" />
```

</AfclPreview>

### Skeleton avatar

<AfclPreview id="skeleton-avatar">

```html
<Skeleton type="avatar" class="w-20 h-20" />
```

</AfclPreview>

## Spinner

Spinner component is used to display a loading state for a component.

<AfclPreview id="spinner">

```js
import { Spinner } from '@/afcl'
```

```html
<Spinner class="w-10 h-10" />
```

</AfclPreview>

## Country Flag

The Country Flag component displays national flags using ISO 3166-1 alpha-2 country codes.

<AfclPreview id="country-flag">

```js
import { CountryFlag } from '@/afcl'
```

```html
<CountryFlag countryCode="ua" />
```

</AfclPreview>

## Bar Chart

Under the hood AdminForth uses MIT-licensed [ApexCharts](https://apexcharts.com/). It has very rich variety of options, you can pass
any of native settings to `options` prop. Here we will only show some basics.

`color` of a series is optional: series without it take the chart palette colors in order, so several bar charts on one page stay consistent.

<AfclPreview id="bar-chart">

```js
import { BarChart } from '@/afcl'
```

```html
<BarChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
  }"
/>
```

</AfclPreview>

### Y-axis labels

<AfclPreview id="bar-chart-y-axis">

```html
<BarChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
//diff-add
    yaxis: {
//diff-add
      stepSize: 1, // needed if your data is integer
//diff-add
      labels: {
//diff-add
        show: true,
//diff-add
        style: {
//diff-add
          fontFamily: 'Inter, sans-serif',
//diff-add
          cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
//diff-add
        }
//diff-add
      }
//diff-add
    }
  }"
/>
```

</AfclPreview>

### X-axis labels and formatting labels

<AfclPreview id="bar-chart-x-axis">

```ts
import dayjs from 'dayjs'
```

```html
<BarChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
//diff-add
    xaxis: {
//diff-add
      labels: {
//diff-add
        show: true,
//diff-add
        formatter: function (value) {
//diff-add
          return dayjs(value).format('DD MMM');
//diff-add
        },
//diff-add
        style: {
//diff-add
          fontFamily: 'Inter, sans-serif',
//diff-add
          cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
//diff-add
        }
//diff-add
      }
//diff-add
    }
  }"
/>
```

</AfclPreview>

### Grid

<AfclPreview id="bar-chart-grid">

```html
<BarChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
//diff-add
    grid: {
//diff-add
      show: true,
//diff-add
      borderColor: 'rgba(0, 0, 0, 0.1)',
//diff-add
      strokeDashArray: 4, 
//diff-add
      position: 'back',
//diff-add
      xaxis: {
//diff-add
        lines: {
//diff-add
          show: true
//diff-add
        }
//diff-add
      },
//diff-add
      yaxis: {  
//diff-add
        lines: {
//diff-add
          show: true
//diff-add
        }
//diff-add
      }
//diff-add
    }
  }"
/>
```

</AfclPreview>

### Data labels

<AfclPreview id="bar-chart-data-labels">

```html
<BarChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
//diff-add
    dataLabels: {
//diff-add
      formatter: function (value) {
//diff-add
        return `⬆️ ${value}`;
//diff-add
      },
//diff-add
      enabled: true,
//diff-add
      style: {
//diff-add
        fontSize: '12px',
//diff-add
        fontFamily: 'Inter, sans-serif',
//diff-add
      }
//diff-add
    }
  }"
/>
```

</AfclPreview>

### Stacked bars and legend

<AfclPreview id="bar-chart-stacked">

```html
<BarChart
  :data="[
    { countCars: 2, countBikes: 3, x: '02 Jun 2025'}, 
    { countCars: 5, countBikes: 1, x: '03 Jun 2025'}, 
    { countCars: 3, countBikes: 4, x: '04 Jun 2025'}, 
    { countCars: 4, countBikes: 2, x: '05 Jun 2025'}, 
    { countCars: 2, countBikes: 3, x: '06 Jun 2025'},
  ]"
  :series="[
    {
      name: $t('Cars'),
      fieldName: 'countCars',
      color: '#4E79A7',
    },
    {
      name: $t('Bikes'),
      fieldName: 'countBikes',
      color: '#F28E2B',
    }
  ]"
  :options="{
    chart: {
      height: 250,
//diff-add
      stacked: true,
    },
//diff-add
    legend: {
//diff-add
      show: true,
//diff-add
    },
  }"
/>
```

</AfclPreview>

### Horizontal bars

<AfclPreview id="bar-chart-horizontal">

```html
<BarChart
  :data="[
    { countCars: 2, countBikes: 3, x: '02 Jun 2025'}, 
    { countCars: 5, countBikes: 1, x: '03 Jun 2025'}, 
    { countCars: 3, countBikes: 4, x: '04 Jun 2025'}, 
    { countCars: 4, countBikes: 2, x: '05 Jun 2025'}, 
    { countCars: 2, countBikes: 3, x: '06 Jun 2025'},
  ]"
  :series="[
    {
      name: $t('Cars'),
      fieldName: 'countCars',
      color: '#4E79A7',
    },
    {
      name: $t('Bikes'),
      fieldName: 'countBikes',
      color: '#F28E2B',
    }
  ]"
  :options="{
    chart: {
      height: 250,
      type: 'bar',
    },
//diff-add
    plotOptions: {
//diff-add
      bar: {
//diff-add
        horizontal: true,
//diff-add
      }
//diff-add
    },
    legend: {
      show: true,
    },
  }"
/>
```

</AfclPreview>

## Area Chart

<AfclPreview id="area-chart">

```js
import { AreaChart } from '@/afcl'
```

```html
<AreaChart
  :data="[
    { count: 1, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'}, 
  ]"
  :series="[{
    name: $t('Added apartments'),
    fieldName: 'count',
    color: '#4E79A7',
  }]"
  :options="{
    chart: {
      height: 250,
    },
  }"
/>
```

</AfclPreview>

### Multiple lines

<AfclPreview id="area-chart-multiple">

```html
<AreaChart
  :data="[
    { countCars: 2, countBikes: 3, x: '02 Jun 2025'}, 
    { countCars: 5, countBikes: 1, x: '03 Jun 2025'}, 
    { countCars: 3, countBikes: 4, x: '04 Jun 2025'}, 
    { countCars: 4, countBikes: 2, x: '05 Jun 2025'}, 
    { countCars: 2, countBikes: 3, x: '06 Jun 2025'},
  ]"
  :series="[
    {
      name: $t('Cars'),
      fieldName: 'countCars',
      color: '#4E79A7',
    },
    {
      name: $t('Bikes'),
      fieldName: 'countBikes',
      color: '#F28E2B',
    }
  ]"
  :options="{
    chart: {
      height: 250,
    },
  }"
/>
```

</AfclPreview>

### Stacked area

<AfclPreview id="area-chart-stacked">

```html
<AreaChart
  :data="[
    { countCars: 2, countBikes: 3, x: '02 Jun 2025'}, 
    { countCars: 5, countBikes: 1, x: '03 Jun 2025'}, 
    { countCars: 3, countBikes: 4, x: '04 Jun 2025'}, 
    { countCars: 4, countBikes: 2, x: '05 Jun 2025'}, 
    { countCars: 2, countBikes: 3, x: '06 Jun 2025'},
  ]"
  :series="[
    {
      name: $t('Cars'),
      fieldName: 'countCars',
      color: '#4E79A7',
    },
    {
      name: $t('Bikes'),
      fieldName: 'countBikes',
      color: '#F28E2B',
    }
  ]"
  :options="{
    chart: {
      height: 250,
//diff-add
      stacked: true,
    },
  }"
/>
```

</AfclPreview>

### Data labels

<AfclPreview id="area-chart-data-labels">

```html
<AreaChart
  :data="[
    { count: 2, x: '02 Jun 2025'}, 
    { count: 5, x: '03 Jun 2025'}, 
    { count: 3, x: '04 Jun 2025'}, 
    { count: 4, x: '05 Jun 2025'}, 
    { count: 2, x: '06 Jun 2025'},
  ]"
  :series="[
    {
      name: $t('Cars'),
      fieldName: 'count',
      color: '#4E79A7',
    },
  ]"
  :options="{
    chart: {
      height: 250,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      }
    },
    grid: {
      padding: {
        left: 10, // to fit the labels
        right: 10,
      },
    },
  }"
/>
```

</AfclPreview>

### Grid, x-axis and y-axis labels

See [Bar Chart](#bar-chart) for details, the config is the same.

## Pie Chart

### Basic

<AfclPreview id="pie-chart">

```js
import { PieChart } from '@/afcl'
```

```html
<PieChart
  :data="[
    { amount: 5, label: 'Cars'},
    { amount: 3, label: 'Bikes'},
    { amount: 2, label: 'Trucks'},
    { amount: 1, label: 'Boats'},
  ]"
  :options="{
    chart: {
      height: 250,
    },
  }"
/>
```

</AfclPreview>

### Pie with data labels

<AfclPreview id="pie-chart-data-labels">

```html
<PieChart
  :data="[
    { amount: 5, label: 'Cars'},
    { amount: 3, label: 'Bikes'},
    { amount: 2, label: 'Trucks'},
    { amount: 1, label: 'Boats'},
  ]"
  :options="{
    chart: {
      height: 250,
    },
//diff-add
    dataLabels: {
//diff-add
      enabled: true,
//diff-add
    },
//diff-add
    plotOptions: {
//diff-add
      pie: {
//diff-add
        dataLabels: {
//diff-add
          offset: -10, // Moves labels closer to or further from the slices
//diff-add
          minAngleToShowLabel: 10, // Ensures that small slices don't show labels
//diff-add
        },
//diff-add
        expandOnClick: true,
//diff-add
      },
//diff-add
    },
  }"
/>
```

</AfclPreview>

### Donut Chart

<AfclPreview id="pie-chart-donut">

```html
<PieChart
  :data="[
    { amount: 5, label: 'Cars'},
    { amount: 3, label: 'Bikes'},
    { amount: 2, label: 'Trucks'},
    { amount: 1, label: 'Boats'},
  ]"
  :options="{
    chart: {
      height: 250,
//diff-add
      type: 'donut',
    },
  }"
/>
```

</AfclPreview>

### Fill donut with total info

<AfclPreview id="pie-chart-donut-total">

```html
<PieChart
  :data="[
    { amount: 5, label: 'Cars'},
    { amount: 3, label: 'Bikes'},
    { amount: 2, label: 'Trucks'},
    { amount: 1, label: 'Boats'},
  ]"
  :options="{
    chart: {
      height: 250,
      type: 'donut',
    },
//diff-add
    plotOptions: {
//diff-add
      pie: {
//diff-add
        donut: {
//diff-add
          labels: {
//diff-add
            total: {
//diff-add
              show: true,
//diff-add
              label: $t('Total wheels'),
//diff-add
              formatter: () => `11`,
//diff-add
            },
//diff-add
          },
//diff-add
        },
//diff-add
      },
//diff-add
    },
  }"
/>
```

</AfclPreview>

### Radial bar chart

<AfclPreview id="pie-chart-radial">

```html
<PieChart
  :data="[
    { amount: 80, label: 'Cars'},
    { amount: 50, label: 'Bikes'},
    { amount: 30, label: 'Trucks'},
    { amount: 70, label: 'Boats'},
  ]"
  :options="{
    chart: {
//diff-add
      height: '300px',
//diff-add
      width: '100%',
//diff-add
      type: 'radialBar',
//diff-add
      sparkline: {
//diff-add
        enabled: true,
//diff-add
      },
    },
//diff-add
    plotOptions: {
//diff-add
      radialBar: {
//diff-add
        track: {
//diff-add
          background: '#E5E7EB',
//diff-add
        },
//diff-add
        dataLabels: {
//diff-add
          name: {
//diff-add
            offsetY: -10
//diff-add
          },
//diff-add
          value: {
//diff-add
            offsetY: 2,
//diff-add
          }
//diff-add
        },
//diff-add
        hollow: {
//diff-add
          margin: 0,
//diff-add
          size: '32%',
//diff-add
        }
//diff-add
      },
//diff-add
    },
//diff-add
    legend: {
//diff-add
      show: true,
//diff-add
      position: 'bottom',
//diff-add
    },
  }"
/>
```

</AfclPreview>

## Treemap Chart

This example is based on the ApexCharts treemap demo “color range”.

<AfclPreview id="treemap-chart">

```ts
import { TreeMapChart } from '@/afcl'

const deltaToColor = (delta: number) => {
  if (delta < -10) return '#B91C1C' // bright red
  if (delta < 0) return '#EF4444'   // red
  if (delta <= 10) return '#22C55E' // green
  return '#15803D'                 // very green
}

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}%` : `${delta}%`)

const data = [
  { x: 'New Delhi', value: 218, delta: 12 },
  { x: 'Kolkata', value: 149, delta: -4 },
  { x: 'Mumbai', value: 184, delta: -14 },
  { x: 'Ahmedabad', value: 55, delta: 6 },
  { x: 'Bangalore', value: 84, delta: 9 },
  { x: 'Pune', value: 31, delta: -2 },
  { x: 'Chennai', value: 70, delta: 0 }
]

// Optional: precompute per-point color using delta
const dataWithColors = data.map((item) => ({
  ...item,
  fillColor: deltaToColor(item.delta),
}))

const series = [
  { name: 'Desktops', fieldName: 'value' },
]
```

```html
<TreeMapChart
  :data="dataWithColors"
  :series="series"
  :options="{
    chart: { height: 350 },
    dataLabels: {
      formatter: (text, { seriesIndex, dataPointIndex, w }) => {
        const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex]
        if (!point) return text
        return `${text} ${formatDelta(point.delta)}`
      },
    },
    plotOptions: {
      treemap: {
        distributed: false,
        enableShades: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value, { seriesIndex, dataPointIndex, w }) => {
          const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex]
          if (!point) return value
          return `${point.value} (${formatDelta(point.delta)})`
        },
      },
    },
  }"
/>
```

</AfclPreview>

## Mixed Chart

### Basic

<AfclPreview id="mixed-chart">

```js
import { MixedChart } from '@/afcl'
```

```html
<MixedChart
  :data="[
    { x: '02 Jun 2025', avgPrice: 100, listedPrice: 100, unlistedPrice: 100},
    { x: '03 Jun 2025', avgPrice: 280, listedPrice: 130, unlistedPrice: 200},
    { x: '04 Jun 2025', avgPrice: 150, listedPrice: 90, unlistedPrice: 60},
    { x: '05 Jun 2025', avgPrice: 100, listedPrice: 100, unlistedPrice: 100},
    { x: '06 Jun 2025', avgPrice: 200, listedPrice: 290, unlistedPrice: 180},
    { x: '07 Jun 2025', avgPrice: 100, listedPrice: 100, unlistedPrice: 100},
  ]"
  :series="[
    { name: $t('Avg Price'), fieldName: 'avgPrice', type: 'line', color: '#4E79A7' },
    { name: $t('Listed Price'), fieldName: 'listedPrice', type: 'column', color: '#F28E2B' },
    { name: $t('Unlisted Price'), fieldName: 'unlistedPrice', type: 'area', color: '#59A14F' },
  ]"
  :options="{
    chart: {
      height: 350,
    },
    stroke: {
      width: [6, 0, 6],  // Line: 6px, Column: 0px (no border), Area: 6px
    },
    fill: {
      opacity: [1, 0.85, 0.25], // Line: 1, Column: 0.85, Area: 0.25
    },
  }"
/>
```

</AfclPreview>

## Json Viewer

### Basic

<AfclPreview id="json-viewer">

```js
import { JsonViewer } from '@/afcl'
```

```html
<JsonViewer 
  :value="[
    {
      id: 1,
      name: 'Alice',
      meta: {
        age: 30,
        hobbies: ['reading', 'biking'],
      }
    },
    {
      id: 2,
      name: 'Bob',
    }
  ]" 
  :expandDepth="2" 
/>
```

</AfclPreview>

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

## Date picker

### Basic

<AfclPreview id="date-picker" minHeight={440}>

```ts
import { ref } from 'vue'
import { DatePicker } from '@/afcl';

const datePickerValue = ref()
```

```html
<DatePicker
  v-model:valueStart="datePickerValue"
  :column="{ type: 'datetime' }"
  label="Pick start"
/>
```

</AfclPreview>
