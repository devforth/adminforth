<template>
  <div ref="chart"></div>
</template>

<script setup lang="ts">
import ApexCharts, { type ApexOptions } from 'apexcharts';
import { ref, type Ref, watch, computed } from 'vue';

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
    sparkline: {
      enabled: false,
    },
    type: "bar",
    width: "100%",
    height: 150,
    toolbar: {
      show: false,
    }
  },
  fill: {
    opacity: 1,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "80%",
      borderRadiusApplication: "end",
      borderRadius: 5,
      dataLabels: {
        position: "top",
      },
    },
  },
  legend: {
    show: false,
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
      show: false,
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
      show: false,
      style: {
        fontFamily: "Inter, sans-serif",
        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
      }
    }
  },
  grid: {
    show: false,
    strokeDashArray: 4,
    padding: {
      left: 2,
      right: 2,
      // top: -20
    },
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
    for (const key in newOptions) {
      if (typeof newOptions[key] === 'object') {
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

let apexChart: ApexCharts;

watch(() => options.value, (value) => {
  if (apexChart) {
    apexChart.updateOptions(value);
  } else {
    console.log('chart.value', value);
    apexChart = new ApexCharts(chart.value, value);
    apexChart.render();
  }
});

</script>