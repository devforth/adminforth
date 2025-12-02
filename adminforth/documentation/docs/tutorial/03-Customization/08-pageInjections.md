
# Page Injections

In addition to ability to create custom pages and overwrite how fields are rendered, you can also inject custom components in standard AdminForth page. 

For example let's add a custom pie chart to the `list` page of the `aparts` resource. Pie chart will show the distribution of the rooms count and more over will allow to filter the list by the rooms count.

```ts title="./resources/apartments.ts"
{
  resourceId: 'aparts',
  ...
//diff-add
  options: {
//diff-add
    pageInjections: {
//diff-add
      list: {
//diff-add
        afterBreadcrumbs: '@@/ApartsPie.vue',
//diff-add
      }
//diff-add
    }   
//diff-add
  }
}
```

Now create file `ApartsPie.vue` in the `custom` folder of your project:

```html title="./custom/ApartsPie.vue"
<template>
    <div class="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-4 mb-5">
      <PieChart
        v-if="data.length"
        :data="rooms" 
        :options="{
          chart: {
            height: 250,
            events: {
              dataPointSelection: function (event, chartContext, config) {
                if (config.selectedDataPoints[0].length) {
                  const selectedRoomsCount = data[config.dataPointIndex].rooms;
                  adminforth.list.updateFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});
                } else {
                  // clear filter
                  adminforth.list.updateFilter({field: 'number_of_rooms', value: undefined});
                }
              }
            }
          },
          dataLabels: {
            enabled: true,
          },
          plotOptions: {
            pie: {
              dataLabels: {
                offset: -10,
                minAngleToShowLabel: 10,
              },
              expandOnClick: true,
            },
          },
        }"
      />
      <div v-else>Loading...</div>
    </div>
  </template>
  
  
  <script setup lang="ts">
  import { onMounted, ref, Ref, computed } from 'vue';
  import { PieChart } from '@/afcl';
  import { callApi } from '@/utils';
  import adminforth from '@/adminforth';
  
  
  const data: Ref<any[]> = ref([]);


  const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"]
  const rooms = computed(() => {
    return data.value?.map(
      (item, i) => ({
        label: item.rooms + ' rooms',
        amount: item.percentage,
        color: COLORS[i],
      })
    );
  });

  onMounted(async () => {
    try {
    data.value = await callApi({ path: '/api/aparts-by-room-percentages', method: 'GET' });
    } catch (error) {
      adminforth.alert({
        message: `Error fetching data: ${error.message}`,
        variant: 'danger',
        timeout: 'unlimited'
      });
      return;
    }
  })
  
  </script>
```


Also we have to add an Api to get percentages:

```ts title="./index.ts"
import type { IAdminUserExpressRequest } from 'adminforth';
import express from 'express';

....

  app.get(`${ADMIN_BASE_URL}/api/aparts-by-room-percentages/`,
    admin.express.authorize(
      async (req: IAdminUserExpressRequest, res: express.Response) => {
        const roomPercentages = await admin.resource('aparts').dataConnector.client.prepare(
          `SELECT 
            number_of_rooms, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY number_of_rooms
          ORDER BY number_of_rooms;
          `
        ).all()
        

        const totalAparts = roomPercentages.reduce((acc, { count }) => acc + count, 0);

        res.json(
          roomPercentages.map(
            ({ number_of_rooms, count }) => ({
              rooms: number_of_rooms,
              percentage: Math.round(count / totalAparts * 100),
            })
          )
        );
      }
    )
  );

  // serve after you added all api
  admin.discoverDatabases();
  admin.express.serve(app)
```

> ☝️ Please note that we are using [Frontend API](/docs/api/FrontendAPI/interfaces/FrontendAPIInterface/) `adminforth.list.updateFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});` to set filter when we are located on apartments list page

Here is how it looks:
![alt text](<Page Injections.png>)


## Login page customization

You can also inject custom components to the login page. 

`loginPageInjections.underInputs` and `loginPageInjections.panelHeader` allows to add one or more panels under or over the login form inputs:

![login Page Injections underInputs](<loginPageInjection.png>)

For example:

```ts title="/index.ts"

new AdminForth({
  ...
  customization: {
    loginPageInjections: {
      underInputs: '@@/CustomLoginFooter.vue',
    }
    ...
  }

  ...
})
```

Now create file `CustomLoginFooter.vue` in the `custom` folder of your project:

```html title="./custom/CustomLoginFooter.vue"
<template>
  <div class="text-center text-gray-500 text-sm mt-4">
    {{$t('By logging in, you agree to our')}} <a href="#" class="text-blue-500">{{$t('Terms of Service')}}</a> {{$t('and')}} <a href="#" class="text-blue-500">{{$t('Privacy Policy')}}</a>
  </div>
</template>
```

Also you can add `panelHeader`

```ts title="/index.ts"

new AdminForth({
  ...
  customization: {
    loginPageInjections: {
      underInputs: '@@/CustomLoginFooter.vue',
//diff-add
      panelHeader: '@@/CustomLoginHeader.vue',
    }
    ...
  }

  ...
})
```

Now create file `CustomLoginHeader.vue` in the `custom` folder of your project:

```html title="./custom/CustomLoginHeader.vue"
<template>
    <div class="flex items-center justify-center gap-2">
        <div class="text-2xl text-black dark:text-white font-bold">
          AdminForth
        </div>
    </div>
</template>
```



## List view page injections shrinking: thin enough to shrink?


When none of `bottom`, `beforeBreadcrumbs`, `beforeActionButtons`, `afterBreadcrumbs` injections are set in list table, the table tries to shrink into viewport for better UX. In other words, in this default mode it moves scroll from body to the table itself:

![alt text](<Group 15.png>)


However if one of the above injections is set, the table will not try to shrink it's height into viewport and will have a fixed height. We apply this behavior because generally page injection might take a lot of height and table risks to be too small to be usable. So vertical scroll is moved to the body (horizontal scroll is still on the table):

![alt text](<Group 17.png>)


However, if you intend to use injection as a small panel, you can set `meta.thinEnoughToShrinkTable` to `true` in the injection instantiation:

```ts title="/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      list: {
        bottom: {
          file: '@@/<ComponentForBottomPanel>.vue',
          meta: {
            thinEnoughToShrinkTable: true,
          }
        }
      }
    }
  }
}
```

![alt text](<Group 19.png>)

If at least one injection will not set or will not define `meta.thinEnoughToShrinkTable` as `true`, the table will not try to shrink into viewport.


## Three dots menu customization

You can also inject custom components to the three dots menu on the top right corner of the page.


![alt text](<Group 4.png>)

```ts title="/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      show: {
          threeDotsDropdownItems: [
            '@@/CheckReadingTime.vue',
          ]
      }
    }
  }
}
```

Now create file `CheckReadingTime.vue` in the `custom` folder of your project:

```html title="./custom/CheckReadingTime.vue"
<template>
  <div class="text-gray-500 text-sm">
    <div class="cursor-pointer flex gap-2 items-center">
      Check reading time
    </div>
  </div>
</template>

<script setup>
import { getReadingTime} from "text-analyzer";
import adminforth from '@/adminforth';

defineExpose({
  click,
});

function checkReadingTime() {
  const text = document.querySelector('[data-af-column="description"]')?.innerText;
  if (text) {
    const readingTime = getReadingTime(text);
    adminforth.alert({
      message: `Reading time: ${readingTime.minutes} minutes`,
      variant: 'success',
    });
  }
  adminforth.list.closeThreeDotsDropdown();
}

function click() {
  checkReadingTime();
}

</script>
```

For this demo we will use text-analyzer package:


```bash 
cd custom
npm i text-analyzer
```


> ☝️ Please note that we are using AdminForth [Frontend API](/docs/api/FrontendAPI/interfaces/FrontendAPIInterface/) `adminforth.list.closeThreeDotsDropdown();` to close the dropdown after the item is clicked.

>☝️ Please note that the injected component might have an exposed click function as well as a defined click function, which executes the click on component logic.

## List table custom action icons


`customActionIcons` allows to add custom actions to the list page

![alt text](<Group 3.png>)


```ts title="/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      list: {
          customActionIcons: [
            '@@/SearchForApartmentInGoogle.vue',
          ]
      }
    }
  }
}
```


Now create file `SearchForApartmentInGoogle.vue` in the `custom` folder of your project:

```html title="./custom/SearchForApartmentInGoogle.vue"
<template>
    <Tooltip>
        <a :href="`https://google.com?q=${record.title}`">
            <IconCardSearch class="w-5 h-5 me-2"/>
        </a>

        <template #tooltip>
            {{$t('Search for competitive apartments in Google')}}
        </template>
    </Tooltip>
</template>

<script setup lang="ts">
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';
import Tooltip from '@/afcl/Tooltip.vue';
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser
}>();
</script>
```

Install used icon:

```sh
cd custom
npm i @iconify-prerendered/vue-mdi
```

## List table row replace injection

`tableRowReplace` lets you fully control how each list table row is rendered. Instead of the default table `<tr>…</tr>` markup, AdminForth will mount your Vue component per record and use its returned DOM to display the row. Use this when you need custom row layouts, extra controls, or conditional styling that goes beyond column-level customization.

Supported forms:
- Single component: `pageInjections.list.tableRowReplace = '@@/MyRowRenderer.vue'`
- Object form with meta: `pageInjections.list.tableRowReplace = { file: '@@/MyRowRenderer.vue', meta: { /* optional */ } }`
- If an array is provided, the first element is used.

Example configuration:

```ts title="/resources/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      list: {
        tableRowReplace: {
          file: '@@/ApartRowRenderer.vue',
          meta: {
            // You can pass any meta your component may read
          }
        }
      }
    }
  }
}
```

Minimal component example (decorate default row with a border):

```vue title="/custom/ApartRowRenderer.vue"
<template>
  <tr class="border border-gray-200 dark:border-gray-700 rounded-sm">
    <slot />
  </tr>
  
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  record: any
  resource: any
  meta: any
  adminUser: any
}>();
</script>
```

Component contract:
- Inputs
  - `record`: the current record object
  - `resource`: the resource config object
  - `meta`: the meta object passed in the injection config
- Slots
  - Default slot: the table’s standard row content (cells) will be projected here. Your component can wrap or style it.
- Output
  - Render a full `<tr>…</tr>` fragment. For example, to replace the standard set of cells with a single full‑width cell, render:

```vue
<tr>
  <td :colspan="columnsCount">
    <slot />
  </td>
</tr>
```

Notes and tips:
- Requirements:
  - Required `<tr></tr>` structure around `<slot />`

## List table beforeActionButtons

`beforeActionButtons` allows injecting one or more compact components into the header bar of the list page, directly to the left of the default action buttons (`Create`, `Filter`, bulk actions, three‑dots menu). Use it for small inputs (quick search, toggle, status chip) rather than large panels.

![alt text](<Group 5.png>)

```ts title="/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      list: {
        beforeActionButtons: {
          file: '@@/UniversalQuickSearch.vue',
          meta: {
            thinEnoughToShrinkTable: true
          }
        }
      }
    }
  }
}
```

Multiple components:

```ts
beforeActionButtons: [
  {
    file: '@@/UniversalQuickSearch.vue',
    meta: { thinEnoughToShrinkTable: true }
  },
  {
    file: '@@/RecordsSummary.vue',
    meta: { thinEnoughToShrinkTable: true }
  }
]
```

> ☝️ Keep these components visually light; wide or tall content should use `afterBreadcrumbs` or `bottom` instead.

## List table custom

## Create/Edit custom Save button

You can replace the default Save button on the create and edit pages with your own Vue component.

Supported locations:
- `pageInjections.create.saveButton`
- `pageInjections.edit.saveButton`

Example configuration:

```ts title="/resources/apartments.ts"
{
  resourceId: 'aparts',
  ...
  options: {
    pageInjections: {
      create: {
        // String shorthand
        saveButton: '@@/SaveBordered.vue',
      },
      edit: {
        // Object form (lets you pass meta later, if needed)
        saveButton: { file: '@@/SaveBordered.vue' },
      }
    }
  }
}
```

Minimal example of a custom save button component:

```vue title="/custom/SaveBordered.vue"
<template>
  <button
    class="px-4 py-2 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
    :disabled="props.disabled || props.saving || !props.isValid"
    @click="props.saveRecord()"
  >
    <span v-if="props.saving">{{$t('Saving…')}}</span>
    <span v-else>{{$t('Save')}}</span>
  </button>
  
</template>

<script setup lang="ts">
const props = defineProps<{
  record: any
  resource: any
  adminUser: any
  meta: any
  saving: boolean
  validating: boolean
  isValid: boolean
  disabled: boolean
  saveRecord: () => Promise<void>
}>();
</script>
```

Notes:
- Your component fully replaces the default Save button in the page header.
- The `saveRecord()` prop triggers the standard AdminForth save flow. Call it on click.
- `saving`, `validating`, `isValid`, and `disabled` reflect the current form state.
- If no `saveButton` is provided, the default button is shown.

Scaffolding via CLI: you can generate a ready-to-wire component and auto-update the resource config using the interactive command:

```bash
adminforth component
# Choose: CRUD page injections → (create|edit) → Save button
```

## Global Injections

You have opportunity to inject custom components to the global layout. For example, you can add a custom items into user menu

* `config.customization.globalInjections.userMenu`:

![alt text](<Group 6.png>)

use `adminforth.closeUserMenuDropdown();` to close the dropdown after the item is clicked.

```ts title="/index.ts"
{
  ...
  customization: {
    globalInjections: {
      userMenu: [
        '@@/CustomUserMenuItem.vue',
      ]
    }
  }
  ...
}
```

Now create file `CustomUserMenuItem.vue` in the `custom` folder of your project:

```html title="./custom/CustomUserMenuItem.vue"
<template>
  <div @click="openCustomPage" class="cursor-pointer flex px-4 py-2 text-sm flex items-center">
    Custom Page
  </div>
</template>

<script setup>
import adminforth from '@/adminforth';

function openCustomPage() {
  adminforth.alert({
    message: 'Custom page is opened',
    variant: 'success',
  });
  adminforth.closeUserMenuDropdown();
}
</script>
```


Also there are:

* `config.customization.globalInjections.header`
* `config.customization.globalInjections.sidebar`
* `config.customization.globalInjections.sidebarTop` — renders inline at the very top of the sidebar, on the same row with the logo/brand name. If the logo is hidden via `showBrandLogoInSidebar: false`, this area expands to the whole row width.
* `config.customization.globalInjections.everyPageBottom`

Unlike `userMenu`, `header` and `sidebar` injections, `everyPageBottom` will be added to the bottom of every page even when user is not logged in.
You can use it to execute some piece of code when any page is loaded. For example, you can add welcoming pop up when user visits a page.

```ts title="/index.ts"
{
  ...
  customization: {
    globalInjections: {
      userMenu: [
        '@@/CustomUserMenuItem.vue',
//diff-remove
      ]
//diff-add
      ],
//diff-add
      everyPageBottom: [
//diff-add
        '@@/AnyPageWelcome.vue',
//diff-add
      ]
    }
  }
  ...
}
```

Now create file `AnyPageWelcome.vue` in the `custom` folder of your project:

```html title="./custom/AnyPageWelcome.vue"
<template></template>

<script setup>
import { onMounted } from 'vue';
import adminforth from '@/adminforth';
onMounted(() => {
  adminforth.alert({
    message: 'Welcome!',
    variant: 'success',
  });
});
</script>
```

## Sidebar Top Injection

You can place compact controls on the very top line of the sidebar, next to the logo/brand name:

```ts title="/index.ts"
new AdminForth({
  ...
  customization: {
    globalInjections: {
      sidebarTop: [
        '@@/QuickSwitch.vue',
      ],
    }
  }
})
```

If you hide the logo with `showBrandLogoInSidebar: false`, components injected via `sidebarTop` will take the whole line width.

## Injection order

Most of injections accept an array of components. By defult the order of components is the same as in the array. You can use standard array methods e.g. `push`, `unshift`, `splice` to put item in desired place.

However, if you want to control the order of injections dynamically, which is very handly for plugins, you can use `meta.afOrder` property in the injection instantiation. The higher the number, the earlier the component will be rendered. For example

```ts title="/index.ts"
{
  ...
  customization: {
    globalInjections: {
      userMenu: [
        {
          file: '@@/CustomUserMenuItem.vue',
          meta: { afOrder: 10 }
        },
        {
          file: '@@/AnotherCustomUserMenuItem.vue',
          meta: { afOrder: 20 }
        },
        {
          file: '@@/LastCustomUserMenuItem.vue',
          meta: { afOrder: 5 }
        },
      ]
    }
  }
  ...
}
```

## Order of components inserted by plugins

For plugins, the plugin developers encouraged to use `meta.afOrder` to control the order of injections and allow to pass it from plugin options.

For example "OAuth2 plugin", when registers a login button component for login page injection, uses `meta.afOrder` and sets it equal to 'YYY' passed in plugin options:

```ts title="/index.ts"
// plugin CODE
adminforth.config.customization.loginPageInjections.underLoginButton.push({
    file: '@@/..vue',
    meta: {
      afOrder: this.pluginOptions.YYY || 0
    }
 })
```

So you can just pass `YYY` option to the plugin to control the order of the injection.

## Custom scripts in head

If you want to inject tags in your html head:

```ts title='./index.ts'

customization: {
  ...
  customHeadItems: [
    {
      tagName: 'script',
      attributes: { async: 'true', defer: 'true' },
      innerCode: "console.log('Hello from HTML head')"
    }
  ],
...
}

```