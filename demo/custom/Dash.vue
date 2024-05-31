
<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome to the dashboard</p>

    <highcharts :options="chartOptions" />

  </div>
</template>

<script setup>

import HighchartsVue from 'highcharts-vue';
import { ref } from 'vue';

const chartOptions = ref({
  title: {
    text: 'Hello World'
  },
  series: [
    {
      name: 'Example Series',
      data: [1, 2, 3, 4, 5]
    }
  ]
});

</script>