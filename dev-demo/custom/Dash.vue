<template>
  <div class="px-4 py-8 bg-blue-50 dark:bg-gray-900 dark:shadow-none min-h-[calc(100vh-56px)]">
  
    <h1 class="mb-4 text-xl font-extrabold text-gray-900 dark:text-white md:text-2xl lg:text-3xl"
      v-html='$t("<span class=\"text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400\">Apartments</span> Statistics.")'></h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5" v-if="data">
        <div class="flex justify-between">
          <div>
            <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{{ data.totalAparts }}</h5>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{  $t('Apartment last 7 days | Apartments last 7 days') }}</p>
          </div>

        </div>

        <BarChart
          :data="apartsCountsByDaysChart"
          :series="[{
            name: $t('Added apartments'),
            fieldName: 'count',
            color: '#1A56DB',
          }]"
          :options="{
            chart: {
              height: 150,
            },
            yaxis: {
              stepSize: 1,
              labels: { show: false }
            },
            grid: {
              show: false,
            }
          }"
        />

      </div>

      <div class="w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-5 md:row-span-2 md:col-span-2" v-if="data">

        <div class="grid grid-cols-2 py-3">
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Listed price') }}</dt>
            <dd class="leading-none text-xl font-bold text-green-500 dark:text-green-400">{{
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          data.totalListedPrice,
        ) }}
            </dd>
          </dl>
          <dl>
            <dt class="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">{{ $t('Unlisted price') }}</dt>
            <dd class="leading-none text-xl font-bold text-red-600 dark:text-red-500">{{
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
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
            color: '#31C48D',
          },
          {
            name: $t('Unlisted Count'),
            fieldName: 'unlisted',
            color: '#F05252',
          }]"
          :options="{
            chart: {
              height: 400,
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
        <div class="flex justify-between">
          <div>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">
              {{ $t('Unlisted vs Listed price' ) }}
            </p>
          </div>
        </div>

        <AreaChart 
          :data="listedVsUnlistedPriceByDays"
          :series="[{
            name: $t('Listed Total Price'),
            fieldName: 'listedPrice',
            color: '#1A56DB',
          },
          {
            name: $t('Unlisted Total Price'),
            fieldName: 'unlistedPrice',
            color: '#7E3BF2',
          }]"
          :options="{
            chart: {
              height: 150,
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { callApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';
import { AreaChart } from '@/afcl';
import BarChart from '@/afcl/BarChart.vue';

const data = ref({});

const  { t } = useI18n();



// const optionsC2 = {
//   series: [
//     {
//       name: "Listed",
//       color: "#31C48D",
//       data: [],
//     },
//     {
//       name: "Unlisted",
//       data: [],
//       color: "#F05252",
//     }
//   ],
//   chart: {
//     sparkline: {
//       enabled: false,
//     },
//     type: "bar",
//     width: "100%",
//     height: 380,
//     toolbar: {
//       show: false,
//     }
//   },
//   fill: {
//     opacity: 1,
//   },
//   plotOptions: {
//     bar: {
//       horizontal: true,
//       columnWidth: "100%",
//       borderRadiusApplication: "end",
//       borderRadius: 6,
//       dataLabels: {
//         position: "top",
//       },
//     },
//   },
//   legend: {
//     show: true,
//     position: "bottom",
//   },
//   dataLabels: {
//     enabled: false,
//   },
//   tooltip: {
//     shared: true,
//     intersect: false,
//     formatter: function (value) {
//       return value
//     },
//   },
//   xaxis: {
//     labels: {
//       show: true,
//       style: {
//         fontFamily: "Inter, sans-serif",
//         cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
//       },
//       formatter: function (value) {
//         return value
//       }
//     },
//     categories: [],
//     axisTicks: {
//       show: false,
//     },
//     axisBorder: {
//       show: false,
//     },
//   },
//   yaxis: {
//     labels: {
//       show: true,
//       style: {
//         fontFamily: "Inter, sans-serif",
//         cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
//       }
//     }
//   },
//   grid: {
//     show: true,
//     strokeDashArray: 4,
//     padding: {
//       left: 10,
//       right: 2,
//       // top: -20
//     },
//   },
//   fill: {
//     opacity: 1,
//   }
// }


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

onMounted(async () => {
  // Fetch data from the API
  // and set it to the chartData
  try {
    data.value = await callApi({path: '/api/dashboard/', method: 'GET'});
  } catch (error) {
    adminforth.alert({
      message: `Error fetching data: ${error.message}`,
      variant: 'danger',
      timeout: 30,
    });
  }

})
</script>