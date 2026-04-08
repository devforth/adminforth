<template>
  <div class="afcl-treemap -mb-2" ref="chart"></div>
</template>

<script setup lang="ts">
import { type ApexOptions } from 'apexcharts';
import { loadApexCharts } from './afcl_utils';
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
  }[],
  options?: ApexOptions,
}>();

const optionsBase: ApexOptions = {
  chart: {
    height: 350,
    type: 'treemap',
    fontFamily: 'Inter, sans-serif',
    toolbar: {
      show: false,
    },
  },
  legend: {
    show: false,
  },
  dataLabels: {
    enabled: true,
    style: {
      fontFamily: 'Inter, sans-serif',
      colors: ['#FFFFFF'],
    },
  },
  plotOptions: {
    treemap: {
      distributed: true,
      enableShades: false,
    },
  },
};

const options = computed(() => {
  if (props.data?.length > 0) {
    props.series.forEach((s) => {
      if (props.data[0][s.fieldName] === undefined) {
        throw new Error(
          `Field ${s.fieldName} not found even in first data point ${JSON.stringify(props.data[0])}, something is wrong`,
        );
      }
    });
  }

  const nextOptions: ApexOptions = {
    ...optionsBase,
    series: props.series.map((s) => ({
      name: s.name,
      data: (props.data ?? []).map((item: any) => {
        const { x, y: _ignoredY, ...rest } = item ?? {};
        return {
          x,
          y: item?.[s.fieldName],
          ...rest,
        };
      }),
    })),
  };

  function mergeOptions(target: any, source: any) {
    if (!source) {
      return;
    }
    for (const key in source) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        mergeOptions(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  mergeOptions(nextOptions, props.options);
  return nextOptions;
});

let apexChart: ApexCharts | null = null;

watch(() => [options.value, chart.value], async (value) => {
  if (!value || !chart.value) {
    return;
  }

  if (apexChart) {
    apexChart.updateOptions(options.value);
  } else {
    const ApexCharts = await loadApexCharts();
    const chartInstance = new ApexCharts(chart.value, options.value);
    apexChart = chartInstance;
    chartInstance.render();
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
  --afcl-treemap-text: #FFFFFF;
}

[data-theme='dark'] {
  --afcl-treemap-text: #FFFFFF;
}

.afcl-treemap {
  .apexcharts-datalabel {
    fill: var(--afcl-treemap-text);
  }

  .apexcharts-legend-text {
    color: var(--afcl-treemap-text) !important;
  }
}
</style>
