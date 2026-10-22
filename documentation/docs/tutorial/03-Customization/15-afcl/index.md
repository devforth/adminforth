---
description: "Reference of the AdminForth Components Library (AFCL): Vue components for custom pages and components of AdminForth, split into buttons and inputs, layout and overlays, data display and charts."
image: "/ogs/afcl.png"  # Path to the OG image
---

# AdminForth Components Library

AFCL is a set of components which you can use as build blocks in your AdminForth application. 
AFCL allows to keep the design consistent with minimal efforts and build new pages faster.
AFCL components follow styling standard and respect theme colors.

Components set is always growing, so you can expect new components to be added in the future.

Import the components you need from `@/afcl` in your custom pages and components:

```js
import { Button, Table } from '@/afcl'
```

Examples are live: each of them renders the code below it with real AFCL components and the default theme.

- [Buttons and Inputs](./01-buttonsAndInputs.md): [Button](./01-buttonsAndInputs.md#button), [Button Group](./01-buttonsAndInputs.md#button-group), [Link](./01-buttonsAndInputs.md#link), [LinkButton](./01-buttonsAndInputs.md#linkbutton), [Select](./01-buttonsAndInputs.md#select), [Input](./01-buttonsAndInputs.md#input), [Code Input](./01-buttonsAndInputs.md#code-input), [Textarea](./01-buttonsAndInputs.md#textarea), [Checkbox](./01-buttonsAndInputs.md#checkbox), [Toggle](./01-buttonsAndInputs.md#toggle), [Date picker](./01-buttonsAndInputs.md#date-picker), [Dropzone](./01-buttonsAndInputs.md#dropzone)
- [Layout and Overlays](./02-layoutAndOverlays.md): [VerticalTabs](./02-layoutAndOverlays.md#verticaltabs), [Card](./02-layoutAndOverlays.md#card), [Page Header](./02-layoutAndOverlays.md#page-header), [Tooltip](./02-layoutAndOverlays.md#tooltip), [Dialog](./02-layoutAndOverlays.md#dialog-pop-up), [Dialog Panel](./02-layoutAndOverlays.md#dialog-panel), [Dropdown Menu](./02-layoutAndOverlays.md#dropdown-menu), [Modal](./02-layoutAndOverlays.md#modal)
- [Data Display and Loading](./03-dataDisplay.md): [Table](./03-dataDisplay.md#table), [Json Viewer](./03-dataDisplay.md#json-viewer), [Country Flag](./03-dataDisplay.md#country-flag), [Badge](./03-dataDisplay.md#badge), [ProgressBar](./03-dataDisplay.md#progressbar), [Skeleton](./03-dataDisplay.md#skeleton), [Spinner](./03-dataDisplay.md#spinner)
- [Charts](./04-charts.md): [Bar Chart](./04-charts.md#bar-chart), [Area Chart](./04-charts.md#area-chart), [Pie Chart](./04-charts.md#pie-chart), [Treemap Chart](./04-charts.md#treemap-chart), [Mixed Chart](./04-charts.md#mixed-chart)
