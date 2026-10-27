<template>
  <div class="afcl-treemap -mb-2" ref="chart"></div>
</template>

<script setup lang="ts">
import type ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { ref, type Ref, watch, computed, onUnmounted } from 'vue';
import { mergeChartOptions } from './chartUtils';
type ApexChartsConstructor = new (el: Element, options: ApexOptions) => ApexCharts;

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
    fontFamily: "'Geist Variable', ui-sans-serif, sans-serif",
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
      fontFamily: "'Geist Variable', ui-sans-serif, sans-serif",
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

  mergeChartOptions(nextOptions, props.options);
  return nextOptions;
});

let apexChart: ApexCharts | null = null;
let ApexChartsCtor: ApexChartsConstructor | null = null;

watch(() => [options.value, chart.value], async (value) => {
  if (!value || !chart.value) {
    return;
  }

  if (!ApexChartsCtor) {
    const module = await import('apexcharts') as { default: ApexChartsConstructor };
    ApexChartsCtor = module.default;
  }

  if (apexChart) {
    apexChart.updateOptions(options.value);
  } else {
    apexChart = new ApexChartsCtor(chart.value, options.value);
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

  // the light apexcharts tooltip has a white background but no text color, so in the dark theme
  // it inherits the light page text; the tooltip is an ink layer and takes the Tooltip tokens
  .apexcharts-tooltip.apexcharts-theme-light {
    @apply border-none rounded-md text-lightTooltipText bg-lightTooltipBackground shadow-popover dark:text-darkTooltipText dark:bg-darkTooltipBackground dark:shadow-darkPopover;

    .apexcharts-tooltip-title {
      @apply bg-transparent border-b-lightTooltipText/10 dark:border-b-darkTooltipText/10;
    }
  }
}
</style>
