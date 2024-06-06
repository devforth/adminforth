<template>
  <div>
    <span v-if="column.foreignResource">
      <RouterLink v-if="row[column.name]" class="font-medium text-blue-600 dark:text-blue-500 hover:brightness-110"
        :to="{ name: 'resource-show', params: { resourceId: column.foreignResource.resourceId, primaryKey: row[column.name].pk } }">
        {{ row[column.name].label }}
      </RouterLink>
      <div v-else>
        <span class="text-gray-400">-</span>
      </div>
    </span>
        
    <span v-else-if="column.type === 'boolean'">
      <span v-if="row[column.name]" class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">Yes</span>
      <span v-else class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400">No</span>
    </span>
    <span v-else-if="column.enum">
      {{ column.enum.find(e => e.value === row[column.name])?.label }}
    </span>
    <span v-else-if="column.type === 'datetime'">
      {{ formatDate(row[column.name]) }}
      
    </span>
    <span v-else>
      {{ row[column.name] }}
    </span>
  </div>
</template>


<script setup>

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps({
  column: Object,
  row: Object
});


function formatDate(date) {
  if (!date) return '';
  return dayjs.utc(date).local().format(coreStore.config?.datesFormat || 'YYYY-MM-DD HH:mm:ss');
}
</script>