
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
    <div id="pie-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import ApexCharts from 'apexcharts';
import { callApi } from '@/utils';


const data: Ref<any[]> = ref([]);

const POSSIBLE_COLORS = ["#1C64F2", "#16BDCA", "#9061F9", "#F0A936", "#F55252", "#3B82F6", "#10B981", "#F472B6", "#6B7280"];

const chatOptions = {
  series: [],
  colors: POSSIBLE_COLORS,
  chart: {
    height: 200,
    width: "100%",
    type: "pie",
    events: {
      dataPointSelection: function (event, chartContext, config) {
        if (config.selectedDataPoints[0].length) {
          const selectedRoomsCount = data.value[config.dataPointIndex].rooms;
          window.adminforth.list.updateFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});
        } else {
          // clear filter
          window.adminforth.list.updateFilter({field: 'number_of_rooms', value: undefined});
        }
      }
    },
  },

  stroke: {
    colors: ["white"],
    lineCap: "",
  },
  plotOptions: {
    pie: {
      labels: {
        show: true,
      },
      size: "100%",
      dataLabels: {
        offset: -25
      }
    },
  },
  labels: ["Direct", "Organic search", "Referrals"],
  dataLabels: {
    enabled: true,
    style: {
      fontFamily: "Inter, sans-serif",
    },
  },
  legend: {
    position: "right",
    fontFamily: "Inter, sans-serif",
  },
  yaxis: {
    labels: {
      formatter: function (value) {
        return value + "%"
      },
    },
  },
  xaxis: {
    labels: {
      formatter: function (value) {
        return value  + "%"
      },
    },
    axisTicks: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
  }, 
}

onMounted(async () => {
  try {
    data.value = await callApi({path: '/api/aparts-by-room-percentages', method: 'GET'});
  } catch (error) {
    window.adminforth.alert({
      message: `Error fetching data: ${error.message}`,
      variant: 'danger',
      timeout: 'unlimited'
    });
    return;
  }

  chatOptions.series = data.value.map((item) => item.percentage);
  chatOptions.labels = data.value.map((item) => `${item.rooms} rooms`);
  const chart = new ApexCharts(document.getElementById("pie-chart"), chatOptions);
  chart.render();

})

</script>
```

Then initialize npm in `custom` directory if you didn't do this and install required packages:
```bash
npm init -y
npm install apexcharts --save-dev
```

Also we have to add an Api to get percentages:

```ts title="./index.ts"
  app.get(`${ADMIN_BASE_URL}/api/aparts-by-room-percentages/`,
    admin.express.authorize(
      async (req, res) => {
        const roomPercentages = await admin.resource('aparts').dataConnector.db.prepare(
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

> ☝️ Please note that we are using [Frontend API](/docs/api/types/FrontendAPI/interfaces/FrontendAPIInterface/) `window.adminforth.list.updateFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});` to set filter when we are located on apartments list page

Here is how it looks:
![alt text](<Page Injections.png>)


## Login page customization

You can also inject custom components to the login page. 

`loginPageInjections.underInputs` allows to add one or more panels under the login form inputs:

![login Page Injections underInputs](<Group 2 (1).png>)

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
    By logging in, you agree to our <a href="#" class="text-blue-500">Terms of Service</a> and <a href="#" class="text-blue-500">Privacy Policy</a>
  </div>
</template>
```
  

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
    <div @click="checkReadingTime" class="cursor-pointer flex gap-2 items-center">
      Check reading time
    </div>
  </div>
</template>

<script setup>
import { getReadingTime} from "text-analyzer";

function checkReadingTime() {
  const text = document.querySelector('[data-af-column="description"]')?.innerText;
  if (text) {
    const readingTime = getReadingTime(text);
    window.adminforth.alert({
      message: `Reading time: ${readingTime} minutes`,
      variant: 'success',
    });
  }
  window.adminforth.list.closeThreeDotsDropdown();
}
</script>
```

For this demo we will use text-analyzer package:


```bash 
cd custom
npm init -y
npm install text-analyzer --save
```


> ☝️ Please note that we are using AdminForth [Frontend API](/docs/api/types/FrontendAPI/interfaces/FrontendAPIInterface/) `window.adminforth.list.closeThreeDotsDropdown();` to close the dropdown after the item is clicked.


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
    <a :href="`https://google.com?q=${record.title}`" :data-tooltip-target="`tooltip-google-${record.id}`"
       class="font-medium text-lightPrimary dark:text-darkPrimary hover:underline ml-2"
    >
        <IconCardSearch class="w-5 h-5 me-2"/>
    </a>

    <div :id="`tooltip-google-${record.id}`" role="tooltip"
        class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
      Search for competitive apartments in Google
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
</template>

<script setup>
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';

const props = defineProps(['column', 'record', 'meta']);

</script>
```

Install used icon:

```sh
cd custom
npm i @iconify-prerendered/vue-mdi
```

## Global Injections

You have opportunity to inject custom components to the global layout. For example, you can add a custom items into user menu

* `config.customization.globalInjections.userMenu`:

![alt text](<Group 6.png>)

use `window.adminforth.closeUserMenuDropdown();` to close the dropdown after the item is clicked.

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
function openCustomPage() {
  window.adminforth.alert({
    message: 'Custom page is opened',
    variant: 'success',
  });
  window.adminforth.closeUserMenuDropdown();
}
</script>
```


Also there are:

* `config.customization.globalInjections.header`
* `config.customization.globalInjections.sidebar`