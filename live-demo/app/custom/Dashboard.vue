<template>
  <div class="px-4 py-4 bg-blue-50 dark:bg-gray-900 dark:shadow-none" :style="{ minHeight: heightOfDashboard + 'px' }">
  
    <div class="flex flex-wrap gap-4">
      <div class="flex min-w-[18rem] flex-[1_1_40rem] flex-wrap content-start gap-4">
        <div class="min-w-[18rem] flex-[1_1_18rem] bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5 flex flex-col justify-between" v-if="data">
          <div>
            <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{{ data.totalAparts }}</h5>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}</p>
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

        <div class="min-w-[18rem] flex-[1_1_18rem] bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
          <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ $t('Top countries') }}</p>
          <PieChart
            :data="topCountries"
            :options="{
              chart: { type: 'pie'},
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

        <div class="min-w-[18rem] flex-[1_1_18rem] bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
          <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{  $t('Apartment by rooms') }}</p>
          <PieChart
            :data="apartsCountsByRooms"
            :options="{
              chart: { type: 'donut', height: 250 },
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

        <div class="min-w-[18rem] flex-[1_1_18rem] bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
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
                height: 320,
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

      <div class="min-w-[20rem] flex-[1_1_32rem] bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
        <div class="flex flex-wrap gap-4 py-3">
          <dl class="min-w-[12rem] flex-1">
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Listed price') }}</dt>
            <dd class="leading-none text-xl font-bold dark:text-green-400" :style="{color:COLORS[0]}">{{
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, }).format(
                data.totalListedPrice,
              ) }}
            </dd>
          </dl>
          <dl class="min-w-[12rem] flex-1">
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
              height: 600,
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

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { callApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';
import { AreaChart, BarChart, PieChart } from '@/afcl';

const heightOfDashboard = computed(() => {
  const headerHeight = window.document.getElementById('af-header-nav')?.offsetHeight || 0;
  return window.innerHeight - headerHeight;
});

const data: Ref<{listedVsUnlistedPriceByDays: any, listedVsUnlistedByDays: any, 
  apartsByDays: any, apartsCountsByRooms: any, topCountries: any, totalAparts: any} | null> = ref(null);

const { t } = useI18n();

const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"]

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
      message: (t(`Error fetching data: {message}`), { message: error.message }),
      variant: 'danger',
    });
  }
})
</script>