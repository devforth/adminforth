<template>
  <!-- ApexCharts takes colors as values, so the grid and the axis labels get the tokens from here -->
  <div class="@container p-4 [&_.apexcharts-gridline]:stroke-lightCardBorder dark:[&_.apexcharts-gridline]:stroke-darkCardBorder [&_.apexcharts-text]:fill-lightCardDescription dark:[&_.apexcharts-text]:fill-darkCardDescription">
    <PageHeader :title="$t('Dashboard')" class="mb-6" />

    <div v-if="data" class="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-6">
      <Card size="md" :class="[TILE_CLASS, '@xl:col-span-2']">
        <div>
          <h3 :class="TITLE_CLASS">{{ $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}</h3>
          <p :class="VALUE_CLASS">{{ data.totalAparts }}</p>
        </div>
        <BarChart
          :data="apartsByDays"
          :series="[{ name: $t('Added apartments'), fieldName: 'count' }]"
          :options="barOptions(false)"
        />
      </Card>

      <Card size="md" :class="[TILE_CLASS, '@5xl:col-span-2']">
        <h3 :class="TITLE_CLASS">{{ $t('Top countries') }}</h3>
        <div class="flex flex-1 items-center gap-4">
          <PieChart class="w-36 shrink-0" :data="topCountries" :options="pieOptions('pie')" />
          <ul :class="LEGEND_CLASS">
            <li v-for="country in topCountries" :key="country.label" class="flex items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-sm" :style="{ backgroundColor: country.color }"></span>
              <CountryFlag :countryCode="country.label" size="sm" />
              {{ country.label }}
              <span :class="LEGEND_VALUE_CLASS">{{ country.amount }}</span>
            </li>
          </ul>
        </div>
      </Card>

      <Card size="md" :class="[TILE_CLASS, '@5xl:col-span-2']">
        <h3 :class="TITLE_CLASS">{{ $t('Apartment by rooms') }}</h3>
        <div class="flex flex-1 items-center gap-4">
          <div class="relative w-36 shrink-0">
            <PieChart :data="apartsCountsByRooms" :options="pieOptions('donut')" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-sm font-semibold tabular-nums text-lightCardTitle dark:text-darkCardTitle">{{ NUMBER.format(data.totalSquareMeters) }} m²</span>
              <span class="text-xs text-lightCardDescription dark:text-darkCardDescription">{{ $t('Total square') }}</span>
            </div>
          </div>
          <ul :class="LEGEND_CLASS">
            <li v-for="rooms in apartsCountsByRooms" :key="rooms.label" class="flex items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-sm" :style="{ backgroundColor: rooms.color }"></span>
              {{ rooms.label }}
              <span :class="LEGEND_VALUE_CLASS">{{ rooms.amount }}</span>
            </li>
          </ul>
        </div>
      </Card>

      <Card size="md" :class="[TILE_CLASS, '@xl:col-span-2 @5xl:col-span-3']">
        <h3 :class="TITLE_CLASS">{{ $t('Unlisted vs Listed price') }}</h3>
        <dl class="flex flex-wrap gap-x-8 gap-y-2">
          <div v-for="total in priceTotals" :key="total.label">
            <dt class="flex items-center gap-1.5 text-xs text-lightCardDescription dark:text-darkCardDescription">
              <span class="h-0.5 w-3 rounded-full" :style="{ backgroundColor: total.color }"></span>
              {{ total.label }}
            </dt>
            <dd :class="VALUE_CLASS">{{ USD.format(total.value) }}</dd>
          </div>
        </dl>
        <AreaChart
          :data="priceByDays"
          :series="[
            { name: $t('Listed'), fieldName: 'listedPrice', color: CHART_COLORS[0] },
            { name: $t('Unlisted'), fieldName: 'unlistedPrice', color: CHART_COLORS[1] },
          ]"
          :options="areaOptions()"
        />
      </Card>

      <Card size="md" :class="[TILE_CLASS, '@xl:col-span-2 @5xl:col-span-3']">
        <dl class="flex flex-wrap gap-x-8 gap-y-2">
          <div v-for="total in countTotals" :key="total.label">
            <dt class="flex items-center gap-1.5 text-xs text-lightCardDescription dark:text-darkCardDescription">
              <span class="h-2 w-2 rounded-sm" :style="{ backgroundColor: total.color }"></span>
              {{ total.label }}
            </dt>
            <dd :class="VALUE_CLASS">{{ total.value }}</dd>
          </div>
        </dl>
        <BarChart
          :data="countByDays"
          :series="[
            { name: $t('Listed Count'), fieldName: 'listed' },
            { name: $t('Unlisted Count'), fieldName: 'unlisted' },
          ]"
          :options="barOptions(true)"
        />
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { callApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';
import { useCoreStore } from '@/stores/core';
import { AreaChart, BarChart, Card, CountryFlag, PageHeader, PieChart } from '@/afcl';
import { CHART_COLORS } from '@/afcl/chartUtils';

type DashboardData = {
  apartsByDays: { day: string, count: number }[],
  totalAparts: number,
  listedVsUnlistedByDays: { day: string, listed: number, unlisted: number }[],
  apartsCountsByRooms: { number_of_rooms: number, count: number }[],
  topCountries: { country: string, count: number }[],
  totalSquareMeters: number,
  totalListedPrice: number,
  totalUnlistedPrice: number,
  listedVsUnlistedPriceByDays: { day: string, listedPrice: number, unlistedPrice: number }[],
};

// title and value of a chart tile, see the Charts board in adminforth/design/system.html
const TILE_CLASS = 'flex min-w-0 flex-col gap-3';
const TITLE_CLASS = 'text-xs font-medium text-lightCardDescription dark:text-darkCardDescription';
const VALUE_CLASS = 'text-xl font-semibold tracking-tight tabular-nums text-lightCardTitle dark:text-darkCardTitle';
const LEGEND_CLASS = 'flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-lightCardDescription dark:text-darkCardDescription';
const LEGEND_VALUE_CLASS = 'ml-auto font-medium tabular-nums text-lightCardTitle dark:text-darkCardTitle';

const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const USD_COMPACT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' });

// ApexCharts ignores a resize of the card until its first animation ends,
// without animations a chart follows the card when the agent panel opens or closes
const CHART = { fontFamily: 'inherit', animations: { enabled: false } };
// recessive grid: horizontal lines only, the negative top padding takes back the room ApexCharts keeps for a title
const GRID = { show: true, strokeDashArray: 0, padding: { top: -20 }, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } };
const X_LABELS = { show: true, rotate: 0, hideOverlappingLabels: true };

const data: Ref<DashboardData | null> = ref(null);

const { t } = useI18n();
const coreStore = useCoreStore();

const formatDay = (day: string) => dayjs(day).format('DD MMM');

const apartsByDays = computed(() => data.value!.apartsByDays.map((item) => ({
  x: formatDay(item.day),
  count: item.count,
})));

const priceByDays = computed(() => data.value!.listedVsUnlistedPriceByDays.map((item) => ({
  x: formatDay(item.day),
  listedPrice: Math.round(item.listedPrice),
  unlistedPrice: Math.round(item.unlistedPrice),
})));

const countByDays = computed(() => data.value!.listedVsUnlistedByDays.map((item) => ({
  x: formatDay(item.day),
  listed: item.listed,
  unlisted: item.unlisted,
})));

const apartsCountsByRooms = computed(() => data.value!.apartsCountsByRooms.map((item, i) => ({
  label: t('{number_of_rooms} rooms', { number_of_rooms: item.number_of_rooms }),
  amount: item.count,
  color: CHART_COLORS[i],
})));

const topCountries = computed(() => data.value!.topCountries.map((item, i) => ({
  label: item.country,
  amount: item.count,
  color: CHART_COLORS[i],
})));

const priceTotals = computed(() => [
  { label: t('Listed price'), value: data.value!.totalListedPrice, color: CHART_COLORS[0] },
  { label: t('Unlisted price'), value: data.value!.totalUnlistedPrice, color: CHART_COLORS[1] },
]);

const countTotals = computed(() => [
  { label: t('Listed Count'), value: countByDays.value.reduce((sum, day) => sum + day.listed, 0), color: CHART_COLORS[0] },
  { label: t('Unlisted Count'), value: countByDays.value.reduce((sum, day) => sum + day.unlisted, 0), color: CHART_COLORS[1] },
]);

function barOptions(stacked: boolean) {
  return {
    chart: { ...CHART, height: stacked ? 200 : 160, stacked },
    tooltip: { theme: coreStore.theme },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    grid: GRID,
    xaxis: { labels: X_LABELS },
  };
}

function areaOptions() {
  return {
    chart: { ...CHART, height: 200 },
    tooltip: { theme: coreStore.theme, y: { formatter: (value: number) => USD.format(value) } },
    legend: { show: false },
    fill: { type: 'solid', opacity: 0.12 },
    stroke: { curve: 'straight', width: 2 },
    grid: GRID,
    xaxis: { labels: X_LABELS },
    yaxis: { show: true, labels: { formatter: (value: number) => USD_COMPACT.format(value) } },
  };
}

function pieOptions(type: 'pie' | 'donut') {
  return {
    chart: { ...CHART, type, height: 144 },
    tooltip: { theme: coreStore.theme },
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '64%', labels: { show: false } } } },
  };
}

onMounted(async () => {
  try {
    data.value = await callApi({ path: '/api/dashboard/', method: 'GET' });
  } catch (error) {
    adminforth.alert({
      message: t('Error fetching data: {message}', { message: error.message }),
      variant: 'danger',
    });
  }
});
</script>
