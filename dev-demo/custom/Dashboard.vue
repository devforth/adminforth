<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <section class="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-xl shadow-cyan-950/20">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              {{ t('Custom page') }}
            </p>
            <h1 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {{ t('Dev demo dashboard') }}
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {{ t('A custom AdminForth homepage that summarizes the car demo across every connected database and the operational resources already configured in this workspace.') }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-md lg:grid-cols-1 xl:grid-cols-3">
            <div
              v-for="metric in operationalCards"
              :key="metric.label"
              class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"
            >
              <p class="text-xs uppercase tracking-[0.2em] text-slate-300">{{ metric.label }}</p>
              <p class="mt-2 text-2xl font-semibold text-white">{{ metric.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <template v-if="dashboard">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <div class="h-1.5 w-14 rounded-full" :style="{ backgroundColor: card.color }"></div>
            <p class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{{ card.label }}</p>
            <p class="mt-2 text-3xl font-semibold tracking-tight">{{ card.value }}</p>
            <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ card.helper }}</p>
          </article>
        </section>

        <section class="grid gap-4 xl:grid-cols-3">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none xl:col-span-2">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold tracking-tight">{{ t('Cars by data source') }}</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ t('Each source keeps its own fleet, so the dashboard compares total records, listed records, and average price side by side.') }}
                </p>
              </div>
            </div>

            <BarChart
              :data="sourceTotalsChart"
              :series="[
                {
                  name: t('All cars'),
                  fieldName: 'total',
                  color: CHART_COLORS[0],
                },
                {
                  name: t('Listed cars'),
                  fieldName: 'listed',
                  color: CHART_COLORS[1],
                },
              ]"
              :options="{
                chart: {
                  height: 320,
                  toolbar: { show: false },
                },
                dataLabels: {
                  enabled: false,
                },
                yaxis: {
                  labels: { show: true },
                },
                grid: {
                  borderColor: '#e2e8f0',
                },
              }"
            />

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div
                v-for="source in dashboard.sourceTotals"
                :key="source.source"
                class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{{ source.source }}</p>
                <div class="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <p>{{ formatNumber(source.count) }} {{ t('cars') }}</p>
                  <p>{{ formatNumber(source.listed) }} {{ t('listed') }}</p>
                  <p>{{ formatCurrency(source.avgPrice) }} {{ t('avg price') }}</p>
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h2 class="text-lg font-semibold tracking-tight">{{ t('Engine mix') }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('Distribution of electric, diesel, petrol, and hybrid configurations across the demo fleet.') }}
            </p>

            <PieChart
              :data="engineTypeChart"
              :options="{
                chart: {
                  type: 'donut',
                  height: 320,
                },
                legend: {
                  position: 'bottom',
                },
                dataLabels: {
                  enabled: false,
                },
                plotOptions: {
                  pie: {
                    donut: {
                      labels: {
                        show: true,
                        total: {
                          show: true,
                          label: t('Fleet size'),
                          formatter: () => formatNumber(dashboard.summary.totalCars),
                        },
                      },
                    },
                  },
                },
              }"
            />
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <h2 class="text-lg font-semibold tracking-tight">{{ t('Body styles') }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('Most common body types in the generated fleet data.') }}
            </p>

            <BarChart
              :data="bodyTypeChart"
              :series="[
                {
                  name: t('Cars'),
                  fieldName: 'count',
                  color: CHART_COLORS[2],
                },
              ]"
              :options="{
                chart: {
                  height: 320,
                  toolbar: { show: false },
                },
                dataLabels: {
                  enabled: false,
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    borderRadius: 6,
                  },
                },
                xaxis: {
                  labels: { show: true },
                },
                grid: {
                  borderColor: '#e2e8f0',
                },
              }"
            />
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none xl:col-span-2">
            <h2 class="text-lg font-semibold tracking-tight">{{ t('Most common models') }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('Top repeated model combinations across all seeded demo resources.') }}
            </p>

            <BarChart
              :data="topModelsChart"
              :series="[
                {
                  name: t('Occurrences'),
                  fieldName: 'count',
                  color: CHART_COLORS[3],
                },
              ]"
              :options="{
                chart: {
                  height: 340,
                  toolbar: { show: false },
                },
                dataLabels: {
                  enabled: false,
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    borderRadius: 6,
                  },
                },
                xaxis: {
                  labels: { show: true },
                },
                grid: {
                  borderColor: '#e2e8f0',
                },
              }"
            />
          </article>
        </section>
      </template>

      <section
        v-else
        class="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
      >
        <p class="text-lg font-medium">{{ isLoading ? t('Loading dashboard...') : t('Dashboard data is not available yet.') }}</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ t('The page is mounted correctly. Once the backend route responds, the charts render automatically.') }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminforth } from '@/adminforth';
import { BarChart, PieChart } from '@/afcl';
import { callApi } from '@/utils';

type BreakdownPoint = {
  label: string;
  amount: number;
};

type SourceTotal = {
  source: string;
  count: number;
  listed: number;
  avgPrice: number;
};

type TopModelPoint = {
  x: string;
  count: number;
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
  sourceTotals: SourceTotal[];
  engineTypeBreakdown: BreakdownPoint[];
  bodyTypeBreakdown: BreakdownPoint[];
  topModels: TopModelPoint[];
};

const CHART_COLORS = ['#0f766e', '#2563eb', '#ea580c', '#7c3aed', '#dc2626', '#0891b2'];

const dashboard = ref<DashboardData | null>(null);
const isLoading = ref(true);

const { t } = useI18n();
const { alert } = useAdminforth();

const numberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const listedShare = computed(() => {
  if (!dashboard.value || dashboard.value.summary.totalCars === 0) {
    return 0;
  }

  return Math.round((dashboard.value.summary.listedCars / dashboard.value.summary.totalCars) * 100);
});

const summaryCards = computed(() => {
  if (!dashboard.value) {
    return [];
  }

  return [
    {
      label: t('Total cars'),
      value: formatNumber(dashboard.value.summary.totalCars),
      helper: t('Across all five demo data sources.'),
      color: CHART_COLORS[0],
    },
    {
      label: t('Listed share'),
      value: `${listedShare.value}%`,
      helper: t('{listed} listed / {unlisted} unlisted', {
        listed: formatNumber(dashboard.value.summary.listedCars),
        unlisted: formatNumber(dashboard.value.summary.unlistedCars),
      }),
      color: CHART_COLORS[1],
    },
    {
      label: t('Average price'),
      value: formatCurrency(dashboard.value.summary.averagePrice),
      helper: t('Mean price of the generated fleet.'),
      color: CHART_COLORS[2],
    },
    {
      label: t('Average mileage'),
      value: `${formatNumber(dashboard.value.summary.averageMileage)} km`,
      helper: t('Mean odometer reading across all sources.'),
      color: CHART_COLORS[3],
    },
  ];
});

const operationalCards = computed(() => {
  if (!dashboard.value) {
    return [];
  }

  return [
    {
      label: t('Admin users'),
      value: formatNumber(dashboard.value.operations.adminUsers),
    },
    {
      label: t('Agent sessions'),
      value: formatNumber(dashboard.value.operations.sessions),
    },
    {
      label: t('Background jobs'),
      value: formatNumber(dashboard.value.operations.backgroundJobs),
    },
  ];
});

const sourceTotalsChart = computed(() => {
  return dashboard.value?.sourceTotals.map((source) => ({
    x: source.source,
    total: source.count,
    listed: source.listed,
  })) ?? [];
});

const engineTypeChart = computed(() => {
  return dashboard.value?.engineTypeBreakdown.map((item, index) => ({
    label: item.label,
    amount: item.amount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) ?? [];
});

const bodyTypeChart = computed(() => {
  return dashboard.value?.bodyTypeBreakdown.map((item) => ({
    x: item.label,
    count: item.amount,
  })) ?? [];
});

const topModelsChart = computed(() => {
  return dashboard.value?.topModels.map((item) => ({
    x: item.x,
    count: item.count,
  })) ?? [];
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

onMounted(async () => {
  try {
    const response = await callApi({ path: '/api/dashboard/', method: 'GET' });
    if (response) {
      dashboard.value = response as DashboardData;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    alert({
      message: t('Error fetching dashboard data: {message}', { message }),
      variant: 'danger',
    });
  } finally {
    isLoading.value = false;
  }
});
</script>