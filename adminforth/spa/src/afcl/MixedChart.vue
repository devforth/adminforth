<template>
  <div class="-mb-2" ref="chart"></div>
</template>

<script setup lang="ts">
import ApexCharts, { type ApexOptions } from 'apexcharts';
import { ref, onUnmounted, watch, computed } from 'vue';

const props = defineProps<{
  data: {
    x: string,
    [key: string]: any,
  }[],
  series: {
    name: string,
    fieldName: string,
    color?: string,
    type: 'column' | 'area' | 'line',
  }[],
  options?: ApexOptions,
}>();

const chart = ref<HTMLElement | null>(null);

const optionsBase = {
  chart: {
    height: 250,
    type: 'line',
    stacked: false,
    fontFamily: "Inter, sans-serif",
    toolbar: {
      show: false,
    }
  },
  stroke: {
    curve: 'smooth',
  },
  grid: {
    show: false,
    strokeDashArray: 4,
    padding: {
      left: 3,
      right: 3,
      top: 3,
      bottom: 3
    },
  },
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

const chartOptions = computed(() => {
  if (props.data?.length > 0) {
    props.series.forEach((s) => {
      if (props.data[0][s.fieldName] === undefined) {
        throw new Error(`Field ${s.fieldName} not found even in first data point ${JSON.stringify(props.data[0])}, something is wrong`);
      }
    });
  }
  
  const options = {
    ...optionsBase,
    series: props.series.map((s) => ({
      name: s.name,
      type: s.type,
      color: s.color,
      data: props.data?.map((item) => item[s.fieldName]) ?? [],
    })),
    labels: props.data?.map((item) => item.x) ?? [],
  };

  function mergeOptions(options: any, newOptions: any) {
    if (!newOptions) {
      return;
    }
    for (const key in newOptions) {
      if (typeof newOptions[key] === 'object' && !Array.isArray(newOptions[key])) {
        if (!options[key]) {
          options[key] = {};
        }
        mergeOptions(options[key], newOptions[key]);
      } else {
        options[key] = newOptions[key];
      }
    }
  }
  mergeOptions(options, props.options);

  return options;
});

let apexChart: ApexCharts | null = null;


watch(() => [chartOptions.value, chart.value], ([newOptions, newRef]) => {
  if (!newOptions || !newRef) {
    return;
  }
  
  if (apexChart) {
    apexChart.updateOptions(newOptions);
  } else if (chart.value) {
    apexChart = new ApexCharts(chart.value, newOptions);
    apexChart.render();
  }
}, { deep: true });

onUnmounted(() => {
  if (apexChart) {
    apexChart.destroy();
  }
});
</script>