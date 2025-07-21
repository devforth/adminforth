<template>
  <div class="px-4 py-4 bg-blue-50 dark:bg-gray-900 dark:shadow-none min-h-screen">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <!-- Total Apartments Chart -->
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5">
        <div>
          <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{{ data.totalAparts }}</h5>
          <p class="text-base font-normal text-gray-500 dark:text-gray-400">
            {{ $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}
          </p>
        </div>
        <BarChart
          :data="apartsCountsByDaysChart"
          :series="[{ name: $t('Added apartments'), fieldName: 'count', color: COLORS[0] }]"
          :options="{ chart: { height: 130 }, yaxis: { stepSize: 1, labels: { show: false } }, grid: { show: false } }"
        />
      </div>

      <!-- Top Countries Pie -->
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5">
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Top countries') }}</p>
        <PieChart
          :data="topCountries"
          :options="{
            chart: { type: 'pie' },
            legend: { show: false },
            dataLabels: {
              enabled: true,
              formatter: (value, o) => o.w.config.labels[o.seriesIndex]
            }
          }"
        />
      </div>

      <!-- Listed vs Unlisted Count -->
      <div class="w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5 lg:row-span-2 xl:col-span-2">
        <div class="grid grid-cols-2 py-3">
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Listed price') }}</dt>
            <dd class="leading-none text-xl font-bold dark:text-green-400" :style="{ color: COLORS[0] }">
              {{ formatCurrency(data.totalListedPrice) }}
            </dd>
          </dl>
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Unlisted price') }}</dt>
            <dd class="leading-none text-xl font-bold dark:text-red-500" :style="{ color: COLORS[1] }">
              {{ formatCurrency(data.totalUnlistedPrice) }}
            </dd>
          </dl>
        </div>

        <BarChart
          :data="listedVsUnlistedCountByDays"
          :series="[
            { name: $t('Listed Count'), fieldName: 'listed', color: COLORS[0] },
            { name: $t('Unlisted Count'), fieldName: 'unlisted', color: COLORS[1] }
          ]"
          :options="{
            chart: { height: 500 },
            xaxis: { labels: { show: true }, stepSize: 1 },
            yaxis: { labels: { show: true } },
            grid: { show: true },
            plotOptions: { bar: { horizontal: true } }
          }"
        />
      </div>

      <!-- Apartments by Rooms Pie -->
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5">
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Apartment by rooms') }}</p>
        <PieChart
          :data="apartsCountsByRooms"
          :options="{
            chart: { type: 'donut' },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    total: {
                      show: true,
                      label: $t('Total square'),
                      formatter: () => `${data.totalSquareMeters.toFixed(0)} m²`
                    }
                  }
                }
              }
            }
          }"
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { AreaChart, BarChart, PieChart } from '@/afcl';

const { t } = useI18n();
const COLORS = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F'];

const data = {
  totalAparts: 32,
  totalListedPrice: 4560000,
  totalUnlistedPrice: 1230000,
  totalSquareMeters: 2345,
  apartsByDays: [
    { day: '2025-07-17', count: 3 },
    { day: '2025-07-16', count: 6 },
    { day: '2025-07-15', count: 8 },
    { day: '2025-07-14', count: 5 },
    { day: '2025-07-13', count: 4 },
    { day: '2025-07-12', count: 3 },
    { day: '2025-07-11', count: 3 }
  ],
  topCountries: [
    { country: 'US', count: 12 },
    { country: 'FR', count: 7 },
    { country: 'DE', count: 5 },
    { country: 'UA', count: 8 }
  ],
  apartsCountsByRooms: [
    { number_of_rooms: 1, count: 6 },
    { number_of_rooms: 2, count: 10 },
    { number_of_rooms: 3, count: 9 },
    { number_of_rooms: 4, count: 7 }
  ],
  listedVsUnlistedByDays: [
    { day: '2025-07-17', listed: 3, unlisted: 1 },
    { day: '2025-07-16', listed: 5, unlisted: 2 },
    { day: '2025-07-15', listed: 4, unlisted: 3 }
  ],
  listedVsUnlistedPriceByDays: [
    { day: '2025-07-17', listedPrice: 1000000, unlistedPrice: 400000 },
    { day: '2025-07-16', listedPrice: 900000, unlistedPrice: 350000 },
    { day: '2025-07-15', listedPrice: 800000, unlistedPrice: 300000 }
  ]
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const apartsCountsByDaysChart = computed(() =>
  data.apartsByDays.slice().reverse().map(item => ({
    x: dayjs(item.day).format('DD MMM'),
    count: item.count
  }))
);

const listedVsUnlistedPriceByDays = computed(() =>
  data.listedVsUnlistedPriceByDays.map(item => ({
    x: dayjs(item.day).format('DD MMM'),
    listedPrice: item.listedPrice.toFixed(2),
    unlistedPrice: item.unlistedPrice.toFixed(2)
  }))
);

const listedVsUnlistedCountByDays = computed(() =>
  data.listedVsUnlistedByDays.map(item => ({
    x: dayjs(item.day).format('DD MMM'),
    listed: item.listed,
    unlisted: item.unlisted
  }))
);

const apartsCountsByRooms = computed(() =>
  data.apartsCountsByRooms.map((item, i) => ({
    label: t(`{number_of_rooms} rooms`, { number_of_rooms: item.number_of_rooms }),
    amount: item.count,
    color: COLORS[i]
  }))
);

const topCountries = computed(() =>
  data.topCountries.map((item, i) => ({
    label: item.country,
    amount: item.count,
    color: COLORS[i]
  }))
);
</script>
