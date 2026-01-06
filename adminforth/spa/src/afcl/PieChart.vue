<template>
  <div class="-mb-2" ref="chart"></div>
</template>

<script setup lang="ts">
import ApexCharts, { type ApexOptions } from 'apexcharts';
import { ref, type Ref, watch, computed, onUnmounted } from 'vue';

const chart: Ref<HTMLDivElement | null> = ref(null);

const props = defineProps<{
  data: {
    label: string,
    amount: number,
    color?: string,
    [key: string]: any,
  }[],
  options?: ApexOptions,
}>();

const SUGGESTED_COLORS = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC949", "#B07AA1", "#FF9DA6", "#9C755F", "#BAB0AC",
  "#2B8A86", "#CC4D58", "#F7941D", "#F9C232", "#729B33", "#497288", "#16578D", "#5F4D99", "#F9F871", "#F9F871",
];


//  [ "#2B8A86", "#CC4D58", "#F7941D", "#F9C232", "#729B33", "#497288", "#16578D", "#5F4D99",]
//  ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"], // Professional Cool Tones
//  ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD"], // Balanced Vibrant Colors
//  ["#6A4C93", "#1982C4", "#8AC926", "#FF595E", "#FFCA3A"], // Bold and Distinct
//  ["#0077B6", "#0096C7", "#00B4D8", "#90E0EF", "#CAF0F8"], // Ocean Blues
//  ["#3A0CA3", "#7209B7", "#F72585", "#4361EE", "#4CC9F0"], // Vivid Purples and Blues
//  ["#FF9F1C", "#FFBF69", "#CBF3F0", "#2EC4B6", "#011627"], // Warm and Cool Mix
//  ["#8338EC", "#3A86FF", "#FB5607", "#FF006E", "#FFBE0B"], // Fun and Playful
//  ["#F94144", "#F3722C", "#F8961E", "#F9844A", "#F9C74F"], // Warm Gradient


const optionsBase = {
    series: [],
    colors: [],
    labels: [],
    chart: {
      height: 400,
      width: "100%",
      type: "pie",
    },
    stroke: {
      colors: ["transparent"],
      lineCap: "",
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
              fontFamily: "Inter, sans-serif",
              offsetY: 20,
            },
            total: {
              showAlways: true,
              show: false,
              fontFamily: "Inter, sans-serif",
              label: "",
              formatter: function (w: any) {
                const sum = w.globals.seriesTotals.reduce((a: any, b: any) => {
                  return a + b
                }, 0)
                return sum 
              },
            },
            value: {
              show: true,
              fontFamily: "Inter, sans-serif",
              offsetY: -20,
              formatter: function (value: any) {
                return value + "k"
              },
            },
          },
          size: "80%",
        },
      },
    },
    grid: {
      padding: {
        top: 3,
        left: 3,
        right: 3,
        bottom: 3,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
    yaxis: {
      labels: {
        formatter: function (value: any) {
          return value;
        },
      },
    },
    xaxis: {
      labels: {
        formatter: function (value: any) {
          return value;
        },
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
};

const options = computed(() => {
  
  const options = {
    ...optionsBase,
   
    // shade and gradient take from first series
    series: props.data?.map((item) => item.amount) ?? [],
    colors: props.data?.map((item, index) => item.color ?? SUGGESTED_COLORS[index]) ?? [],
    labels: props.data?.map((item) => item.label) ?? [],
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

<style lang="scss">
:root {
  --tw-text-gray: #6B7280;
  
}
[data-theme='dark'] {
  --tw-text-gray: #9CA3AF;
}

.apexcharts-datalabel-label,
.apexcharts-datalabel-value{
  fill: var(--tw-text-gray);
}
.apexcharts-legend-text {
  color: var(--tw-text-gray) !important;
}

</style>