<template>
  <div>
    <span @click="(e)=>{e.stopPropagation()}" v-if="column.foreignResource">
      <RouterLink v-if="record[column.name]" class="font-medium text-lightPrimary dark:text-darkPrimary hover:brightness-110 whitespace-nowrap"
        :to="{ name: 'resource-show', params: { resourceId: column.foreignResource.resourceId, primaryKey: record[column.name].pk } }">
        {{ record[column.name].label }}
      </RouterLink>
      <div v-else>
        <span class="text-gray-400">-</span>
      </div>
    </span>
        
    <span v-else-if="column.type === 'boolean'">
      <span v-if="record[column.name]" class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">Yes</span>
      <span v-else class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400">No</span>
    </span>
    <span v-else-if="column.enum">
      {{ checkEmptyValues(column.enum.find(e => e.value === record[column.name])?.label || record[column.name], route.meta.type) }}
    </span>
    <span v-else-if="column.type === 'datetime'" class="whitespace-nowrap">
      {{ checkEmptyValues(formatDate(record[column.name]),route.meta.type) }}
    </span>
    <span v-else-if="column.type === 'richtext'">
      <div v-html="protectAgainstXSS(record[column.name])" class="allow-lists"></div>
    </span>
    <span v-else>
      {{ checkEmptyValues(record[column.name],route.meta.type) }}
    </span>
  </div>
</template>


<script setup>

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {checkEmptyValues} from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import sanitizeHtml from 'sanitize-html';


import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();
const route = useRoute();


dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps({
  column: Object,
  record: Object
});

function protectAgainstXSS(value) {
  return sanitizeHtml(value, {
    allowedAttributes: {
    'li': [ 'data-list' ],
    } 
  });
}


function formatDate(date) {
  if (!date) return '';
  return dayjs.utc(date).local().format(coreStore.config?.datesFormat || 'YYYY-MM-DD HH:mm:ss');
}
</script>

<style lang="scss">

.allow-lists {
  ol {
    list-style-type: decimal;
    padding-left: 1.5em;

    li[data-list="bullet"] {
      list-style-type: disc;
    }
    li[data-list="ordered"] {
      list-style-type: decimal;
    }
  }

} 
</style>