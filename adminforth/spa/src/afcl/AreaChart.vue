<template>
  <div class="-mb-2" ref="chart"></div>
</template>

<script setup lang="ts">
import ApexCharts, { type ApexOptions } from 'apexcharts';
import { ref, type Ref, watch, computed, onUnmounted } from 'vue';

const chart: Ref<HTMLDivElement | null> = ref(null);

const props = defineProps<{
  data: {
    x: string,
    [key: string]: any,
  }[],
  series: {
    name: string,
    fieldName: string,
    color: string,
  }[],
  options: ApexOptions,
}>();



const optionsBase = {
  chart: {
    height: 150,
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
      left: 3,
      right: 3,
      top: 3,
      bottom: 3
    },
  },
  series: [],
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

const options = computed(() => {
  if (props.data?.length > 0) {
    props.series.forEach((s) => {
      if (props.data[0][s.fieldName] === undefined) {
        throw new Error(`Field ${s.fieldName} not found even in first data point ${JSON.stringify(props.data[0])}, something is wrong`);
      }
    });
  }
  const options = {
    ...optionsBase,
   
    // shade and gradient take from first series
    fill: {
      ...optionsBase.fill,
      gradient: {
        ...optionsBase.fill.gradient,
        shade: props.series[0].color,
        gradientToColors: [props.series[0].color],
      },
    },
    series: props.series.map((s) => ({
      data: props.data?.map((item) => item[s.fieldName]) ?? [],
      ...s,
    })),
    xaxis: {
      ...optionsBase.xaxis,
      categories: props.data?.map((item) => item.x) ?? [],
    },
  };

  // for each of  ...props.options  merge on lowest level. so if { chart: {height : 2} }, it should not replace chart level, only height level
  function mergeOptions(options: any, newOptions: any) {
    if (!newOptions) {
      return;
    }
    for (const key in newOptions) {
      // and is not array
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

watch(() => [options.value, chart.value], (value) => {
  if (!value || !chart.value) {
    return;
  }
  if (apexChart) {
    apexChart.updateOptions(options.value);
  } else {
    apexChart = new ApexCharts(chart.value, options.value);
    apexChart.render();
  }
});

onUnmounted(() => {
  if (apexChart) {
    apexChart.destroy();
  }
});

</script>