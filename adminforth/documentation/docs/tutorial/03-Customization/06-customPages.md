# Custom pages

Most Admin Panels should have some Dashboards or custom pages. 

In AdminForth creation of custom page is very simple.

To add custom package to SPA bundle you have to initialize npm in `custom` directory and install required packages:

```bash
cd ./custom
npm init -y
npm install apexcharts --save-dev
```

> 👆 Note: for better development experience we recommend to create file `custom/tsconfig.json` with the following content:
> ```json
> {
>   "compilerOptions": {
>     "baseUrl": ".",
>     "paths": {
>       "@/*": [
>         "../node_modules/adminforth/dist/spa/src/*"
>       ],
>       "*": [
>         "../node_modules/adminforth/dist/spa/node_modules/*"
>       ],
>       "@@/*": [
>         "."
>       ]
>     }
>   }
> }
> ```

Create a Vue component in the `custom` directory of your project, e.g. `Dashboard.vue`:

```html title="./custom/Dashboard.vue"
<template>
  <div class="px-4 py-8 bg-blue-50 dark:bg-gray-900 dark:shadow-none min-h-screen">
    <h1 class="mb-4 text-xl font-extrabold text-gray-900 dark:text-white md:text-2xl lg:text-3xl"><span
        class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">{{ $t('Apartments') }}</span>
      Statistics.</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6" v-if="data">
        <div class="flex justify-between">
          <div>
            <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{{ data.totalAparts }}</h5>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}</p>
          </div>

        </div>
        <div id="area-chart"></div>

      </div>

      <div class="w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6 md:row-span-2 md:col-span-2" v-if="data">

        <div class="grid grid-cols-2 py-3">
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Listed price') }}</dt>
            <dd class="leading-none text-xl font-bold text-green-500 dark:text-green-400">{{
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          data.totalListedPrice,
        ) }}
            </dd>
          </dl>
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Unlisted price') }}</dt>
            <dd class="leading-none text-xl font-bold text-red-600 dark:text-red-500">{{
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          data.totalUnlistedPrice,
        ) }}
            </dd>
          </dl>
        </div>

        <div id="bar-chart"></div>

      </div>

      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6" v-if="data">
        <div class="flex justify-between mb-5">
          <div>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">
              {{ $t('Unlisted vs Listed price') }}
            </p>
          </div>
        </div>
        <div id="size-chart" class="[&>div]:mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ApexCharts from 'apexcharts';
import dayjs from 'dayjs';
import { callApi } from '@/utils';

const data = ref({});

const optionsC1 = {
  chart: {
    height: 145,
    type: "area",
    fontFamily: "Inter, sans-serif",
    dropShadow: {
      enabled: false,
    },
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    enabled: true,
    x: {
      show: false,
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
      shade: "#1C64F2",
      gradientToColors: ["#1C64F2"],
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 6,
  },
  grid: {
    show: false,
    strokeDashArray: 4,
    padding: {
      left: 2,
      right: 2,
      top: 0
    },
  },
  series: [
    {
      name: "Added apartments",
      data: [],
      color: "#1A56DB",
    },
  ],
  xaxis: {
    categories: [],
    labels: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    show: false,
  },
};

const optionsC2 = {
  series: [
    {
      name: "Listed",
      color: "#31C48D",
      data: [],
    },
    {
      name: "Unlisted",
      data: [],
      color: "#F05252",
    }
  ],
  chart: {
    sparkline: {
      enabled: false,
    },
    type: "bar",
    width: "100%",
    height: 400,
    toolbar: {
      show: false,
    }
  },
  fill: {
    opacity: 1,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      columnWidth: "100%",
      borderRadiusApplication: "end",
      borderRadius: 6,
      dataLabels: {
        position: "top",
      },
    },
  },
  legend: {
    show: true,
    position: "bottom",
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    shared: true,
    intersect: false,
    formatter: function (value) {
      return value
    },
  },
  xaxis: {
    labels: {
      show: true,
      style: {
        fontFamily: "Inter, sans-serif",
        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
      },
      formatter: function (value) {
        return value
      }
    },
    categories: [],
    axisTicks: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
  },
  yaxis: {
    labels: {
      show: true,
      style: {
        fontFamily: "Inter, sans-serif",
        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
      }
    }
  },
  grid: {
    show: true,
    strokeDashArray: 4,
    padding: {
      left: 10,
      right: 2,
      // top: -20
    },
  },
  fill: {
    opacity: 1,
  }
}

const optionsC3 = {
  chart: {
    height: 145,
    type: "area",
    fontFamily: "Inter, sans-serif",
    dropShadow: {
      enabled: false,
    },
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    enabled: true,
    x: {
      show: false,
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
      shade: "#1C64F2",
      gradientToColors: ["#1C64F2"],
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 6,
  },
  grid: {
    show: false,
    strokeDashArray: 4,
    padding: {
      left: 2,
      right: 2,
      top: -26
    },
  },
  series: [
    {
      name: "Listed Price",
      data: [],
      color: "#1A56DB",
    },
    {
      name: "Unlisted Price",
      data: [],
      color: "#7E3BF2",
    },
  ],
  xaxis: {
    categories: [],
    labels: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    show: false,
    labels: {
      formatter: function (value) {
        return '$' + value;
      }
    }
  },
}

onMounted(async () => {
  // Fetch data from the API
  // and set it to the chartData
  try {
    data.value = await callApi({path: '/api/dashboard/', method: 'GET'});
  } catch (error) {
    window.adminforth.alert({
      message: `Error fetching data: ${error.message}`,
      variant: 'danger',
      timeout: 'unlimited'
    });
  } 

  const apartsByDaysReverse = data.value.apartsByDays.reverse();

  optionsC1.series[0].data = apartsByDaysReverse.map((item) => item.count);
  optionsC1.xaxis.categories = apartsByDaysReverse.map((item) => dayjs(item.day).format('DD MMM'));
  const chart = new ApexCharts(document.getElementById("area-chart"), optionsC1);
  chart.render();

  optionsC2.series[0].data = data.value.listedVsUnlistedByDays.map((item) => item.listed);
  optionsC2.series[1].data = data.value.listedVsUnlistedByDays.map((item) => item.unlisted);
  optionsC2.xaxis.categories = data.value.listedVsUnlistedByDays.map((item) => dayjs(item.day).format('DD MMM'));
  const chart2 = new ApexCharts(document.getElementById("bar-chart"), optionsC2);
  chart2.render();

  optionsC3.series[0].data = data.value.listedVsUnlistedPriceByDays.map((item) => item.listedPrice.toFixed(2));
  optionsC3.series[1].data = data.value.listedVsUnlistedPriceByDays.map((item) => item.unlistedPrice.toFixed(2));
  optionsC3.xaxis.categories = data.value.listedVsUnlistedPriceByDays.map((item) => dayjs(item.day).format('DD MMM'));
  const chart3 = new ApexCharts(document.getElementById("size-chart"), optionsC3);
  chart3.render();
})
</script>
```

> ☝️ use https://flowbite.com/ to copy-paste pre-designed tailwind design blocks for your pages

Now let's add this page to the AdminForth menu and make it homepage instead of Apartments page:

```ts title="/index.ts"
menu: [
//diff-add
    {
//diff-add
      label: 'Dashboard',
//diff-add
      path: '/overview',
//diff-add
      homepage: true,
//diff-add
      icon: 'flowbite:chart-pie-solid',
//diff-add
      component: '@@/Dashboard.vue',
//diff-add
    },
    {
      label: 'Core',
      icon: 'flowbite:brain-solid',
      open: true,
      children: [
        {
//diff-remove
          homepage: true,  
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
        },
      ]
    },
```


> ☝️ To find icon go to https://icon-sets.iconify.design/flowbite/?query=chart, click on icon you like and copy name:
![Iconify icon select](image-icon-select.png)

You might notice that in mounted hook page fetches custom endpoint '/api/dashboard-stats'. 
Now we have to define this endpoint in the backend to make our page work:


## Defining custom API for own page and components


Open `index.ts` file and add the following code *BEFORE* `admin.express.serve(` !

```ts title="/index.ts"

....

app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
  admin.express.authorize(
    async (req, res) => {
      const days = req.body.days || 7;
      const apartsByDays = await admin.resource('aparts').dataConnector.db.prepare(
        `SELECT 
          strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
          COUNT(*) as count 
        FROM apartments 
        GROUP BY day 
        ORDER BY day DESC
        LIMIT ?;
        `
      ).all(days);

      const totalAparts = apartsByDays.reduce((acc, { count }) => acc + count, 0);

      // add listed, unlisted, listedPrice, unlistedPrice
      const listedVsUnlistedByDays = await admin.resource('aparts').dataConnector.db.prepare(
        `SELECT 
          strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
          SUM(listed) as listed, 
          COUNT(*) - SUM(listed) as unlisted,
          SUM(listed * price) as listedPrice,
          SUM((1 - listed) * price) as unlistedPrice
        FROM apartments
        GROUP BY day
        ORDER BY day DESC
        LIMIT ?;
        `
      ).all(days);

      const listedVsUnlistedPriceByDays = await admin.resource('aparts').dataConnector.db.prepare(
        `SELECT 
          strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
          SUM(listed * price) as listedPrice,
          SUM((1 - listed) * price) as unlistedPrice
        FROM apartments
        GROUP BY day
        ORDER BY day DESC
        LIMIT ?;
        `
      ).all(days);
        
      const totalListedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { listedPrice }) => acc + listedPrice, 0));
      const totalUnlistedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { unlistedPrice }) => acc + unlistedPrice, 0));

      res.json({ 
        apartsByDays,
        totalAparts,
        listedVsUnlistedByDays,
        totalListedPrice,
        totalUnlistedPrice,
        listedVsUnlistedPriceByDays,
      });
    }
  )
);

// serve after you added all api
admin.express.serve(app, express)
admin.discoverDatabases();

```


> ☝️ Please note that we are using `admin.express.authorize` middleware to check if the user is logged in. If you want to make this endpoint public, you can remove this middleware. If user is not logged in, the request will return 401 Unauthorized status code, and protect our statistics from leak.

> ☝️ Moreover if you wrap your endpoint with `admin.express.authorize` middleware, you can access `req.adminUser` object in your endpoint to get the current user information.

> ☝️ AdminForth does not provide any facility to access data in database. You are free to use any ORM like Prisma, TypeORM, Sequelize,
mongoose, or just use raw SQL queries against your tables.


> ☝️ To call API from frontend component we use Adminforth's callApi method.
> However this is not mandatory. Alternatively you can just use plain fetch:
>
> ```ts
> //diff-remove
>   data.value = await callApi({path: '/api/dashboard/', method: 'GET'});
> //diff-add
>   const response = await fetch('/api/dashboard/');
> //diff-add
>   data.value = await response.json();
> ```
> however, the callApi function will handle path prefixing(you can change baseUrl and it will take this into account) and 401 redirect to login when user is logged out

Demo:

![alt text](dashDemo.gif)