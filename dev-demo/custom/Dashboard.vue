<template>
  <div class="flex flex-col gap-4 p-4">
    <div class="flex min-h-9 flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold tracking-tight text-lightBreadcrumbsText dark:text-darkBreadcrumbsText">
        {{ t('Dev demo dashboard') }}
      </h1>
      <dl v-if="dashboard" class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div v-for="metric in operationalMetrics" :key="metric.label" class="flex gap-2">
          <dt class="text-lightCardDescription dark:text-darkCardDescription">{{ metric.label }}</dt>
          <dd class="font-semibold tabular-nums text-lightCardTitle dark:text-darkCardTitle">{{ metric.value }}</dd>
        </div>
      </dl>
    </div>

    <Spinner v-if="isLoading" class="mx-auto my-24 h-8 w-8" />

    <template v-else-if="dashboard">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          v-for="card in summaryCards"
          :key="card.label"
          size="md"
          class="text-sm text-lightCardDescription dark:text-darkCardDescription"
        >
          <p>{{ card.label }}</p>
          <p class="my-1 text-2xl font-semibold tabular-nums tracking-tight text-lightCardTitle dark:text-darkCardTitle">{{ card.value }}</p>
          <p>{{ card.helper }}</p>
        </Card>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <Card
          size="md"
          class="xl:col-span-2"
          :title="t('Cars by data source')"
          :description="t('Each source keeps its own fleet, so the dashboard compares total records, listed records, and average price side by side.')"
        >
          <BarChart
            :data="sourceTotalsChart"
            :series="[
              { name: t('All cars'), fieldName: 'count' },
              { name: t('Listed cars'), fieldName: 'listed' },
            ]"
            :options="COLUMN_CHART_OPTIONS"
          />
          <Table
            class="mt-4"
            :columns="[
              { label: t('Source'), fieldName: 'source' },
              { label: t('Cars'), fieldName: 'count' },
              { label: t('Listed'), fieldName: 'listed' },
              { label: t('Avg price'), fieldName: 'avgPrice' },
            ]"
            :data="sourceTotalsRows"
            :even-highlights="false"
          />
        </Card>

        <Card
          size="md"
          :title="t('Engine mix')"
          :description="t('Distribution of electric, diesel, petrol, and hybrid configurations across the demo fleet.')"
        >
          <PieChart :data="dashboard.engineTypeBreakdown" :options="engineChartOptions" />
        </Card>

        <Card
          size="md"
          :title="t('Body styles')"
          :description="t('Most common body types in the generated fleet data.')"
        >
          <BarChart
            :data="bodyTypeChart"
            :series="[{ name: t('Cars'), fieldName: 'amount' }]"
            :options="HORIZONTAL_BAR_CHART_OPTIONS"
          />
        </Card>

        <Card
          size="md"
          class="xl:col-span-2"
          :title="t('Most common models')"
          :description="t('Top repeated model combinations across all seeded demo resources.')"
        >
          <BarChart
            :data="dashboard.topModels"
            :series="[{ name: t('Occurrences'), fieldName: 'count' }]"
            :options="HORIZONTAL_BAR_CHART_OPTIONS"
          />
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BarChart, Card, PieChart, Spinner, Table } from '@/afcl';
import { callApi } from '@/utils';

type BreakdownPoint = {
  label: string;
  amount: number;
};

type DashboardData = {
  summary: {
    totalCars: number;
    listedCars: number;
    unlistedCars: number;
    averagePrice: number;
    averageMileage: number;
  };
  operations: {
    adminUsers: number;
    sessions: number;
    backgroundJobs: number;
  };
  sourceTotals: {
    source: string;
    count: number;
    listed: number;
    avgPrice: number;
  }[];
  engineTypeBreakdown: BreakdownPoint[];
  bodyTypeBreakdown: BreakdownPoint[];
  topModels: {
    x: string;
    count: number;
  }[];
};

const AXIS_WITH_LABELS = { labels: { show: true } };

const COLUMN_CHART_OPTIONS = {
  chart: { height: 280 },
  legend: { show: true },
  xaxis: AXIS_WITH_LABELS,
  yaxis: AXIS_WITH_LABELS,
};

const HORIZONTAL_BAR_CHART_OPTIONS = {
  chart: { height: 320 },
  plotOptions: { bar: { horizontal: true } },
  xaxis: AXIS_WITH_LABELS,
  yaxis: AXIS_WITH_LABELS,
};

const dashboard = ref<DashboardData | null>(null);
const isLoading = ref(true);

const { t } = useI18n();

const numberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const operationalMetrics = computed(() => [
  { label: t('Admin users'), value: formatNumber(dashboard.value!.operations.adminUsers) },
  { label: t('Agent sessions'), value: formatNumber(dashboard.value!.operations.sessions) },
  { label: t('Background jobs'), value: formatNumber(dashboard.value!.operations.backgroundJobs) },
]);

const summaryCards = computed(() => {
  const { totalCars, listedCars, unlistedCars, averagePrice, averageMileage } = dashboard.value!.summary;
  const listedShare = totalCars === 0 ? 0 : Math.round((listedCars / totalCars) * 100);

  return [
    {
      label: t('Total cars'),
      value: formatNumber(totalCars),
      helper: t('Across all five demo data sources.'),
    },
    {
      label: t('Listed share'),
      value: `${listedShare}%`,
      helper: t('{listed} listed / {unlisted} unlisted', {
        listed: formatNumber(listedCars),
        unlisted: formatNumber(unlistedCars),
      }),
    },
    {
      label: t('Average price'),
      value: formatCurrency(averagePrice),
      helper: t('Mean price of the generated fleet.'),
    },
    {
      label: t('Average mileage'),
      value: `${formatNumber(averageMileage)} km`,
      helper: t('Mean odometer reading across all sources.'),
    },
  ];
});

const sourceTotalsChart = computed(() => dashboard.value!.sourceTotals.map(({ source, count, listed }) => ({ x: source, count, listed })));

const sourceTotalsRows = computed(() => dashboard.value!.sourceTotals.map(({ source, count, listed, avgPrice }) => ({
  source,
  count: formatNumber(count),
  listed: formatNumber(listed),
  avgPrice: formatCurrency(avgPrice),
})));

const bodyTypeChart = computed(() => dashboard.value!.bodyTypeBreakdown.map(({ label, amount }) => ({ x: label, amount })));

const engineChartOptions = computed(() => ({
  chart: { type: 'donut' as const, height: 320 },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          value: { formatter: (value: string) => formatNumber(Number(value)) },
          total: {
            show: true,
            label: t('Fleet size'),
            formatter: () => formatNumber(dashboard.value!.summary.totalCars),
          },
        },
      },
    },
  },
}));

onMounted(async () => {
  dashboard.value = await callApi({ path: '/api/dashboard/', method: 'GET' });
  isLoading.value = false;
});
</script>
