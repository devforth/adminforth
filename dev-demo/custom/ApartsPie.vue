<template>
    <div class="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-4 mb-5">
        <PieChart
            :data="data"
            :options="{
                chart: {
                height: 250,
                },
                dataLabels: {
                enabled: true,
                },
                plotOptions: {
                pie: {
                    dataLabels: {
                    offset: -10, 
                    minAngleToShowLabel: 10, 
                    },
                    expandOnClick: true,
                },
                },
            }"
        />
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref, Ref } from 'vue';
  import { PieChart } from '@/afcl';
  import { callApi } from '@/utils';
  import adminforth from '@/adminforth';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  
  const data: Ref<any[]> = ref([]);
  
  
  onMounted(async () => {
    try {
      data.value = await callApi({path: '/api/aparts-by-room-percentages', method: 'GET'});
    } catch (error) {
      adminforth.alert({
        message: `${t('Error fetching data:')} ${error.message}`,
        variant: 'danger',
        timeout: 'unlimited'
      });
      return;
    }
  })
  
  </script>