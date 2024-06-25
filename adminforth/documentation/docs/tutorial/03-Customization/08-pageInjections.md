
# Page Injections

In addition to ability to create custom pages and overwrite how fields are rendered, you can also inject larger parts of the page. 
This is useful when you want to add some custom content to the page. 

For example let's add a custom pie chart to the `list` page of the `apparts` resource. Pie chart will show the distribution of the rooms count and more over will allow to filter the list by the rooms count.

```ts
{
  resourceId: 'apparts',
  ...
  options: {
    pageInjections: {
      list: {
        afterBreadcrumbs: '@@/AppartsPie.vue',
      }
    }
  }
}
```

Now create file `AppartsPie.vue` in the `custom` folder of your project:

```vue
<template>
  <Bubble 

  

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Bubble } from 'chart.js';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)


const chartData = ref({
  labels: [],
  datasets: [],
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
  const resp = await fetch('/api/dashboard');
  const data = (await resp.json()).countByNumberOfRooms;

  chartData.value.labels = data.map(d => d.numberOfRooms);
  chartData.value.datasets = [
    {
      label: 'Square meters',
      data: data.map(d => d.squareMeters),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    },

  ]
})

</script>
```
