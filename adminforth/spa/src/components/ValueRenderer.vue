<template>
  <div>
    <span
      v-if="column.foreignResource"
      :class="{'flex flex-wrap': column.isArray?.enabled}"
      @click="(e)=>{e.stopPropagation()}"
    >
      <span
        v-if="record[column.name] && column.isArray?.enabled"
        v-for="foreignResource in record[column.name]"
        class="rounded-md m-0.5 bg-lightAnnouncementBG dark:bg-darkAnnouncementBG text-lightAnnouncementText dark:text-darkAnnouncementText py-0.5 px-2.5 text-sm"
      >
        <RouterLink
          class="font-medium text-lightSidebarText dark:text-darkSidebarText hover:brightness-110 whitespace-nowrap"
          :to="{
            name: 'resource-show',
            params: {
              primaryKey: foreignResource.pk,
              resourceId: column.foreignResource
                ? (
                    column.foreignResource.resourceId
                    || column.foreignResource.polymorphicResources?.find(
                        (pr: any) => pr.whenValue === record[column.foreignResource?.polymorphicOn!]
                      )?.resourceId
                  )
                : undefined
            }
          }"
        >
          {{ foreignResource.label }}
        </RouterLink>
      </span>
      <RouterLink v-else-if="record[column.name]" class="font-medium text-lightPrimary dark:text-darkPrimary hover:brightness-110 whitespace-nowrap"
          :to="{
            name: 'resource-show',
            params: {
              primaryKey: record[column.name].pk,
              resourceId: column.foreignResource
                ? (
                    column.foreignResource.resourceId
                    || column.foreignResource.polymorphicResources?.find(
                        (pr: any) => pr.whenValue === record[column.foreignResource?.polymorphicOn!]
                      )?.resourceId
                  )
                : undefined
            }
          }"
        >
        {{ record[column.name].label }}
      </RouterLink>
      <div v-else>
        <span class="text-gray-400">-</span>
      </div>
    </span>
        
    <span v-else-if="column.type === 'boolean'">
      <span v-if="record[column.name] === true" class="af-true-value-icon bg-green-100 whitespace-nowrap text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">{{ $t('Yes') }}</span>
      <span v-else-if="record[column.name] === false" class="af-false-value-icon bg-red-100 whitespace-nowrap text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400">{{ $t('No') }}</span>
      <span v-else class="bg-gray-100 whitespace-nowrap text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-400">{{ $t('Unset') }}</span>
    </span>
    <span
      v-else-if="column.type === 'json' && column.isArray?.enabled"
      class="flex flex-wrap"
    >
      <template v-for="(arrayItem, arrayItemIndex) in record[column.name]">
        <span
          v-if="column.isArray.itemType === 'boolean' && arrayItem"
          :key="`${column.name}-${arrayItemIndex}-true`"
          class="af-true-value-icon bg-green-100 whitespace-nowrap text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">
          {{ $t('Yes') }}
        </span>
        <span
          v-else-if="column.isArray.itemType === 'boolean'"
          :key="`${column.name}-${arrayItemIndex}-false`"
          class="af-false-value-icon bg-red-100 whitespace-nowrap text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400">
          {{ $t('No') }}
        </span>
        <span
          v-else
          :key="`${column.name}-${arrayItemIndex}`"
          class="rounded-md m-0.5 bg-lightAnnouncementBG dark:bg-darkAnnouncementBG text-lightAnnouncementText dark:text-darkAnnouncementText py-0.5 px-2.5 text-sm"
        >
          {{ checkEmptyValues(getArrayItemDisplayValue(arrayItem, column), route.meta.type as "show" | "list") }}
        </span>
      </template>
    </span>
    <span v-else-if="column.enum">
      {{ checkEmptyValues(column.enum.find(e => e.value === record[column.name])?.label || record[column.name], route.meta.type as "show" | "list") }}
    </span>
    <span v-else-if="column.type === 'datetime'" class="whitespace-nowrap">
      {{ checkEmptyValues(formatDateTime(record[column.name]), route.meta.type as "show" | "list") }}
    </span>
    <span v-else-if="column.type === 'date'" class="whitespace-nowrap">
      {{ checkEmptyValues(formatDate(record[column.name]), route.meta.type as "show" | "list") }}
    </span>
    <span v-else-if="column.type === 'time'" class="whitespace-nowrap">
      {{ checkEmptyValues(formatTime(record[column.name]), route.meta.type as "show" | "list") }}
    </span>
    <span v-else-if="column.type === 'decimal'">
      {{ checkEmptyValues(record[column.name] && parseFloat(record[column.name]), route.meta.type as "show" | "list") }}
    </span>
    <span v-else-if="column.type === 'json'">
      <JsonViewer class="min-w-[6rem]" :value="record[column.name]" :expandDepth="column.extra?.jsonCollapsedLevel" copyable sort :theme="coreStore.theme"/>
    </span>
    <span v-else>
      {{ checkEmptyValues(record[column.name], route.meta.type as "show" | "list") }}
    </span>
  </div>
</template>


<script setup lang="ts">

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {checkEmptyValues} from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { JsonViewer } from "vue3-json-viewer";
import "vue3-json-viewer/dist/vue3-json-viewer.css";
import type { AdminForthResourceColumnCommon } from '@/types/Common';

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();
const route = useRoute();


dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps<{
  column: AdminForthResourceColumnCommon,
  record: any
}>();

function formatDateTime(date: string) {
  if (!date) return '';
  return dayjs.utc(date).local().format(`${coreStore.config?.datesFormat} ${coreStore.config?.timeFormat}` || 'YYYY-MM-DD HH:mm:ss');
}

function formatDate(date: string) {
  if (!date) return '';
  return dayjs.utc(date).local().format(coreStore.config?.datesFormat || 'YYYY-MM-DD');
}

function formatTime(time: string) {
  if (!time) return '';
  return dayjs(`0000-00-00 ${time}`).format(coreStore.config?.timeFormat || 'HH:mm:ss');
}

function getArrayItemDisplayValue(value: any, column: AdminForthResourceColumnCommon) {
  if (column.isArray?.itemType === 'datetime') {
    return formatDateTime(value);
  } else if (column.isArray?.itemType === 'date') {
    return formatDate(value);
  } else if (column.isArray?.itemType === 'time') {
    return formatTime(value);
  } else if (column.enum) {
    return column.enum.find(e => e.value === value)?.label || value;
  }

  return value;
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

<style lang="scss" >

.jv-container .jv-code {
  padding: 10px 10px;
}

.jv-container .jv-button[class] {
  @apply text-lightPrimary;
  @apply dark:text-darkPrimary;

}

.jv-container.jv-dark {
  background: transparent;
}

</style>