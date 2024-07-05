
<template>
  <div class="p-4 bg-pink-100 h-screen">
    <h1>Dashboard 111221✅✅✅</h1>
    <ttt />
    <p>Welcome t11o 2111 1 121231ч21п</p>

    <highcharts :options="chartOptions" />
 
  </div>
</template>

<script setup>

import HighchartsVue from 'highcharts-vue';
import { ref } from 'vue';
import ttt from '@@/comp/ttt.vue';

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