
# Page Injections

In addition to ability to create custom pages and overwrite how fields are rendered, you can also inject custom components in standard AdminForth page. 

For example let's add a custom pie chart to the `list` page of the `aparts` resource. Pie chart will show the distribution of the rooms count and more over will allow to filter the list by the rooms count.

```ts title="./resources/apartments.js"
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
          window.adminforth.updateListFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});
        } else {
          // clear filter
          window.adminforth.updateListFilter({field: 'number_of_rooms', value: undefined});
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


Also we have to add an Api to get percentages:

```ts title="./index.ts"
  app.get(`${ADMIN_BASE_URL}/api/aparts-by-room-percentages/`,
    admin.express.authorize(
      async (req, res) => {
        const roomPercentages = await db.prepare(
          `SELECT 
            number_of_rooms, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY number_of_rooms
          ORDER BY number_of_rooms;
          `
        ).all();

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

> ☝️ Please note that we are using `window.adminforth.updateListFilter({field: 'number_of_rooms', operator: 'eq', value: selectedRoomsCount});` to set filter when we are located on apartments list page

Here is how it looks:
![alt text](<Page Injections.png>)