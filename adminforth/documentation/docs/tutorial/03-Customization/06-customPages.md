# Custom pages

Most Admin Panels should have some Dashboards or custom pages. 

In AdminForth creation of custom page is very simpl.

Install CHart.js library into your main package (near `index.ts`):

```bash
npm i vue-chartjs chart.js
```

Create a Vue component in the `custom` directory of your project, e.g. `Dashboard.vue`:

```vue

<template>
  <div>
    <h1 class="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">The Appartments</span> Statistics.</h1>

    <h2 class="mb-4 text-2xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Total square
      by the <span class="underline underline-offset-3 decoration-8 decoration-blue-400 dark:decoration-blue-600">class type</span>
    </h2>

    <Bar
      :options="chartOptions"
      :data="chartData"
    />
    
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)


const chartData = ref({
  labels: [].
  datasets: [
  ]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

onMounted(() => {
  // Fetch data from the API
  // and set it to the chartData
  const resp = await fetch('/api/dashboard-stats');
  const data = (await resp.json()).squareByClassType;

  chartData.value.labels = data.map(d => d.numberOfRooms);
  chartData.value.datasets = [
    {
      label: 'Square meters',
      data: data.map(d => d.squareMeters),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }
  ]
})

```

> 🫨 use https://flowbite.com/ to copy-paste pre-designed tailwind design blocks for your pages

You might notice that in mounted hook page fetches custom endpoint '/api/dashboard-stats'. 

We need to create this endpoint in the backend.

Open `index.ts` file and add the following code:

```ts

....
// serve after you added all api
admin.express.serve(app, express)
admin.discoverDatabases();


app.get('/api/dashboard-stats',
  admin.express.authorize(
    async (req, res) => {
      const stats = await db.query(
        'SELECT number_of_rooms as numberOfRooms, SUM(square_meters) as squareMeters FROM appartments GROUP BY number_of_rooms');
      res.json({ squareByClassType: stats.map});
    }
  )
);

```

> 🫨 Please note that we are using `admin.express.authorize` middleware to check if the user is logged in. If you want to make this endpoint public, you can remove this middleware. If user is not logged in, the request will return 401 Unauthorized status code, and protect our statistics from leak.

> 🫨 Moreover if you wrap your endpoint with `admin.express.authorize` middleware, you can access `req.adminUser` object in your endpoint to get the current user information.

> 🫨 AdminForth does not provide any facility to access data in database. You are free to use any ORM like Prisma, TypeORM, Sequelize,
mongoose, or just use raw SQL queries against your tables.