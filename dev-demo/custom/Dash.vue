<template>
  <div class="px-4 py-4 bg-blue-50 dark:bg-gray-900 dark:shadow-none min-h-[calc(100dvh-55px)] ">
  
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data" >
        <div>
          <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{{ $t('Apartments') }}</h5>
          <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{  $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}</p>
        </div>
        <BarChart
          :data="apartsCountsByDaysChart"
          :series="[{
            name: $t('Added apartments'),
            fieldName: 'count',
            color: COLORS[0],
          }]"
          :options="{
            chart: {
              height: 130,
            },
            yaxis: {
              stepSize: 1,
              labels: { show: false },
            },
            grid: {
              show: false,
            }
          }"
        />
      </div>

      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Top countries') }}</p>
        <PieChart
          :data="topCountries"
          :options="{
            chart: { type: 'pie', height: 240 },
            legend: {
              show: false,
            },
            dataLabels: {
              enabled: true,
              formatter: function (value, o) {
                const countryISO = o.w.config.labels[o.seriesIndex];
                return countryISO;
              }
            },
          }"
        />
      </div>

      <div class="w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5 lg:row-span-2 xl:col-span-2" v-if="data">
        <div class="grid grid-cols-2 py-3">
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Listed price') }}</dt>
            <dd class="leading-none text-xl font-bold dark:text-green-400" :style="{color:COLORS[0]}">{{
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, }).format(
                data.totalListedPrice,
              ) }}
            </dd>
          </dl>
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Unlisted price') }}</dt>
            <dd class="leading-none text-xl font-bold dark:text-red-500" :style="{color:COLORS[1]}">{{
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, }).format(
                data.totalUnlistedPrice,
              ) }}
            </dd>
          </dl>
        </div>

        <BarChart
          :data="listedVsUnlistedCountByDays"
          :series="[{
            name: $t('Listed Count'),
            fieldName: 'listed',
            color: COLORS[0],
          },
          {
            name: $t('Unlisted Count'),
            fieldName: 'unlisted',
            color: COLORS[1],
          }]"
          :options="{
            chart: {
              height: 500,
            },
            xaxis: {
              labels: { show: true },
              stepSize: 1,  // since count is integer, otherwise axis will be float
            },
            yaxis: {
              labels: { show: true }
            },
            grid: {
              show: true,
            },
            plotOptions: {
              bar: { 
                horizontal: true, // by default bars are vertical
              }
            },
          }"
        />

      </div>

      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{  $t('Apartment by rooms') }}</p>
        <PieChart
          :data="apartsCountsByRooms"
          :options="{
            chart: { height: 350, type: 'donut' },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    total: {
                      show: true,
                      label: $t('Total square'),
                      formatter: () => `${data.totalSquareMeters.toFixed(0)} m²`,
                    },
                  },
                },
              },
            },
          }"
        />
      </div>

      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Unlisted vs Listed price' ) }}</p>

        <AreaChart 
          :data="listedVsUnlistedPriceByDays"
          :series="[{
            name: $t('Listed'),
            fieldName: 'listedPrice',
            color: COLORS[0],
          },
          {
            name: $t('Unlisted'),
            fieldName: 'unlistedPrice',
            color: COLORS[1],
          }]"
          :options="{
            chart: {
              height: 250,
            },
            yaxis: {
              labels: {
                formatter: function (value) {
                  return '$' + value;
                }
              }
            },
          }"
        />
      </div>

    </div>

      <!-- <div class="flex justify-center items-center p-80 bg-white">
        <div class="border border-indigo-600 p-5 w-80 h-80 min-w-80 min-h-80 flex items-center flex-col">
          <Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7', records: 110},
    {label: 'Last 30 days', value: '30', records: 320},
    {label: 'Last 90 days', value: '90', records: 310},
    {label: 'None', value: null}
  ]"
  v-model="selected"
>
  <template #item="{option}">
    <div>
      <span>{{ option.label }}</span>
      <span class="ml-2 opacity-50">{{ option.records }} records</span>
    </div>
  </template>
  <template #selected-item="{option}">
    <span>{{ option.label }} 💫</span>
  </template>
</Select>

<Select
  class="w-full"
  :options="[
    {label: 'Last 7 days', value: '7', records: 110},
    {label: 'Last 30 days', value: '30', records: 320},
    {label: 'Last 90 days', value: '90', records: 310},
    {label: 'None', value: null}
  ]"
  v-model="selected"
>
  <template #item="{option}">
    <div>
      <span>{{ option.label }}</span>
      <span class="ml-2 opacity-50">{{ option.records }} records</span>
    </div>
  </template>
  <template #selected-item="{option}">
    <span>{{ option.label }} 💫</span>
  </template>
</Select>
        </div>
      </div> -->

      <!-- <div class="bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5 mt-4">
      </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, computed, watch } from 'vue';
import dayjs from 'dayjs';
import { callApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';
import { AreaChart, BarChart, Input, Link, LinkButton, PieChart, Select, Table, VerticalTabs } from '@/afcl';
import Button from '@/afcl/Button.vue';
import Tooltip from '@/afcl/Tooltip.vue';
import { IconUserCircleSolid, IconGridSolid } from '@iconify-prerendered/vue-flowbite';
import Checkbox from '@/afcl/Checkbox.vue';
const isoFlagToEmoji = (iso) => iso.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))

import { Dropzone } from '@/afcl'

const files: Ref<File[]> = ref([])

watch(files, (files) => {
  console.log('files selected', files);
  setTimeout(() => {
    // clear
    files.length = 0;
  }, 5000);
})

const data: Ref<{listedVsUnlistedPriceByDays: any, listedVsUnlistedByDays: any, 
  apartsByDays: any, apartsCountsByRooms: any, topCountries: any, totalAparts: any} | null> = ref(null);

const { t } = useI18n();

const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"]

const enable = ref(false);

const apartsCountsByDaysChart = computed(() => {
  return data.value.apartsByDays?.reverse().map(
    (item) => ({
      x: dayjs(item.day).format('DD MMM'),
      count: item.count
    })
  );
});

const listedVsUnlistedPriceByDays = computed(() => {
  return data.value.listedVsUnlistedPriceByDays?.map(
    (item) => ({
      x: dayjs(item.day).format('DD MMM'),
      listedPrice: item.listedPrice.toFixed(2),
      unlistedPrice: item.unlistedPrice.toFixed(2),
    })
  );
});

const listedVsUnlistedCountByDays = computed(() => {
  return data.value.listedVsUnlistedByDays?.map(
    (item) => ({
      x: dayjs(item.day).format('DD MMM'),
      listed: item.listed,
      unlisted: item.unlisted,
    })
  );
});

const apartsCountsByRooms = computed(() => {
  return data.value.apartsCountsByRooms?.map(
    (item, i) => ({
      label: t(`{number_of_rooms} rooms`, { number_of_rooms: item.number_of_rooms }),
      amount: item.count,
      color: COLORS[i],
    })
  );
});

const topCountries = computed(() => {
  return data.value.topCountries?.map(
    (item, i) => ({
      label: item.country,
      amount: item.count,
      color: COLORS[i],
    })
  );
});

onMounted(async () => {
  // Fetch data from the API
  try {
    data.value = await callApi({path: '/api/dashboard/', method: 'GET'});
  } catch (error) {
    adminforth.alert({
      message: `${t('Error fetching data: ')} ${error.message}`,
      variant: 'danger',
    });
  }

})
</script>