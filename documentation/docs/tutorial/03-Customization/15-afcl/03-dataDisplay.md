---
description: "Data Display and Loading of the AdminForth Components Library (AFCL) with live examples: Table, Json Viewer, Country Flag, ProgressBar, Skeleton, Spinner."
image: "/ogs/afcl.png"
---

import AfclPreview from '@site/src/components/AfclPreview';

# Data Display and Loading

Tables and other views of data, and indicators of loading and progress. Import the components from `@/afcl`, see [AdminForth Components Library](./index.md).

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

```js
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
//diff-add
  :evenHighlights="false"
></Table>
```

</AfclPreview>

### Custom cell

<AfclPreview id="table-custom-cell">

```ts
import { Table } from '@/afcl'
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

```js
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

```js
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
import { Table } from '@/afcl'
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

```js
import { Table } from '@/afcl'
```

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
import { Table } from '@/afcl'
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

```js
import { Table } from '@/afcl'
```

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
- Missing or `null` nested values always go to the bottom, for ascending and descending order alike.
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
import { Table } from '@/afcl'

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

```js
import { Table } from '@/afcl'
```

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
import { Table } from '@/afcl'
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

## Json Viewer

The Json Viewer lays a JSON value out like Prettier: a node which fits in a line (up to 60 characters, fewer in a narrow place) stays on one line, a longer one breaks by keys. A chevron on the left folds a node, a folded node shows its value in one line and its size. Nodes deeper than `expandDepth` (default `1`) start folded. The copy button appears on hover.

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

### Inline

`inline` shows the value in one line for table cells, a click opens the whole value in a popover. The list page of AdminForth shows JSON columns this way.

<AfclPreview id="json-viewer-inline">

```js
import { JsonViewer } from '@/afcl'
```

```html
<JsonViewer
  inline
  :value="{ campaign: 'cs2026', channel: 'linkedin', touches: 3, verified: true }"
/>
```

</AfclPreview>

## Country Flag

The Country Flag component displays national flags using ISO 3166-1 alpha-2 country codes. A flag has a hairline edge, so white stripes stay visible on a white page. Only the SVG of a shown flag is downloaded.

<AfclPreview id="country-flag">

```js
import { CountryFlag } from '@/afcl'
```

```html
<CountryFlag countryCode="ua" />
```

</AfclPreview>

`size` is `md` (default, 32×24) or `sm` (16×12) for menus, selects and lists:

<AfclPreview id="country-flag-sizes">

```js
import { CountryFlag } from '@/afcl'
```

```html
<div class="flex items-center gap-4">
  <span class="flex items-center gap-2 text-sm"><CountryFlag countryCode="jp" size="sm" />日本語</span>
  <CountryFlag countryCode="jp" />
</div>
```

</AfclPreview>

## Zoomable Image

A Zoomable Image is an image which opens over the whole page on a click, and closes on a click, a scroll or Escape. The dark overlay covers the page and the docked agent chat. The Upload plugin shows its previews with it, the agent chat the images of messages.

<AfclPreview id="zoomable-image">

```js
import { ZoomableImage } from '@/afcl'
```

```html
<ZoomableImage
  src="/img/preview_light.png"
  alt="AdminForth admin panel"
  class="max-w-64 rounded-default border border-lightListBorder dark:border-darkListBorder"
/>
```

</AfclPreview>

The image takes the attributes and classes of an `img`, e.g. `@error` or a size. A click on it does not reach its parents, so it can stay in a clickable block, e.g. a table row which opens the record.

## Badge

A Badge labels a status or a category. Variants are `default`, `success`, `warning`, `danger`, `accent` (the `primary` color of the theme) and `muted`.

<AfclPreview id="badge">

```js
import { Badge } from '@/afcl'
```

```html
<div class="flex flex-wrap items-center gap-2">
  <Badge>Default</Badge>
  <Badge variant="success">Paid</Badge>
  <Badge variant="warning">Pending</Badge>
  <Badge variant="danger">Failed</Badge>
  <Badge variant="accent">New</Badge>
  <Badge variant="muted">Archived</Badge>
</div>
```

</AfclPreview>

To render values of an enum column as badges in the list or show view, use the [Enum Badge](../02-customFieldRendering.md#enum-badge) renderer.

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

```js
import { ProgressBar } from '@/afcl'
```

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

```js
import { ProgressBar } from '@/afcl'
```

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

```js
import { ProgressBar } from '@/afcl'
```

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

```js
import { Skeleton } from '@/afcl'
```

```html
<Skeleton type="image" class="w-full h-40" />
```

</AfclPreview>

### Skeleton input

<AfclPreview id="skeleton-input">

```js
import { Skeleton } from '@/afcl'
```

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

```js
import { Skeleton } from '@/afcl'
```

```html
<Skeleton type="video" class="w-full h-40" />
```

</AfclPreview>

### Skeleton avatar

<AfclPreview id="skeleton-avatar">

```js
import { Skeleton } from '@/afcl'
```

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
