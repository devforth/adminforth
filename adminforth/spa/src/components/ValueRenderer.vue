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
        class="inline-flex items-center rounded-full m-0.5 bg-lightButtonGroupActiveBackground dark:bg-darkButtonGroupActiveBackground text-lightButtonGroupActiveText dark:text-darkButtonGroupActiveText h-5 px-2 text-xs font-medium"
      >
        <RouterLink
          v-if="foreignResource && foreignResource?.pk"
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
      <RouterLink v-else-if="record[column.name] && canShowForeignRecord" class="font-medium text-lightPrimary dark:text-darkPrimary hover:brightness-110 whitespace-nowrap"
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
      <p v-else-if="record[column.name]" class="font-medium text-lightListTableText dark:text-darkListTableText whitespace-nowrap">
        {{ record[column.name].label }}
      </p>
      <div v-else>
        <span class="text-lightInputPlaceholderText dark:text-darkInputPlaceholderText">-</span>
      </div>
    </span>
        
    <span v-else-if="column.type === 'boolean'">
      <span v-if="record[column.name] === true" class="af-true-value-icon gap-1" :class="[BADGE_CLASSES, TRUE_BADGE_CLASSES]"><IconCheck class="w-3 h-3" aria-hidden="true" />{{ $t('Yes') }}</span>
      <span v-else-if="record[column.name] === false" class="af-false-value-icon" :class="[BADGE_CLASSES, FALSE_BADGE_CLASSES]">{{ $t('No') }}</span>
      <span v-else class="border-dashed text-lightInputIconColor border-lightInputBorder dark:text-darkInputIconColor dark:border-darkInputBorder" :class="BADGE_CLASSES">{{ $t('Unset') }}</span>
    </span>
    <span
      v-else-if="column.type === 'json' && column.isArray?.enabled"
      class="flex flex-wrap"
    >
      <template v-for="(arrayItem, arrayItemIndex) in record[column.name]">
        <span
          v-if="column.isArray.itemType === 'boolean' && arrayItem"
          :key="`${column.name}-${arrayItemIndex}-true`"
          class="af-true-value-icon gap-1" :class="[BADGE_CLASSES, TRUE_BADGE_CLASSES]">
          {{ $t('Yes') }}
        </span>
        <span
          v-else-if="column.isArray.itemType === 'boolean'"
          :key="`${column.name}-${arrayItemIndex}-false`"
          class="af-false-value-icon" :class="[BADGE_CLASSES, FALSE_BADGE_CLASSES]">
          {{ $t('No') }}
        </span>
        <span
          v-else
          :key="`${column.name}-${arrayItemIndex}`"
          class="inline-flex items-center rounded-full m-0.5 bg-lightButtonGroupActiveBackground dark:bg-darkButtonGroupActiveBackground text-lightButtonGroupActiveText dark:text-darkButtonGroupActiveText h-5 px-2 text-xs font-medium"
        >
          {{ checkEmptyValues(getArrayItemDisplayValue(arrayItem, column), route.meta.type as "show" | "list") }}
        </span>
      </template>
    </span>
    <span v-else-if="column.enum">
      {{ checkEmptyValues(column.enum.find((e: any) => e.value === record[column.name])?.label || record[column.name], route.meta.type as "show" | "list") }}
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

import {checkEmptyValues, formatDate, formatDateTime, formatTime} from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import "vue3-json-viewer/dist/vue3-json-viewer.css";
import { computed, defineAsyncComponent } from 'vue';
import { IconCheck } from '@iconify-prerendered/vue-lucide';
import type { AdminForthResourceColumnCommon } from '@/types/Common';
const JsonViewer = defineAsyncComponent(() => import('vue3-json-viewer').then(module => module.JsonViewer))

import { useCoreStore } from '@/stores/core';
import type { any } from 'zod';

const BADGE_CLASSES = 'inline-flex items-center whitespace-nowrap me-2 px-2 h-5 rounded-full border text-xs font-medium';
const TRUE_BADGE_CLASSES = 'bg-lightSuccessSoft text-lightSuccess border-lightSuccessBorder dark:bg-darkSuccessSoft dark:text-darkSuccess dark:border-darkSuccessBorder';
const FALSE_BADGE_CLASSES = 'bg-lightSecondaryDarken text-lightInputIconColor border-transparent dark:bg-darkSecondaryLighten dark:text-darkInputIconColor';

const coreStore = useCoreStore();
const route = useRoute();

const props = defineProps<{
  column: any,
  record: any
}>();

const canShowForeignRecord = computed(() => {
  if (props.column.foreignResource.resourceId) {
    return props.column.foreignResource.allowedActions?.show;
  }

  return props.column.foreignResource.polymorphicResources.find(
    (resource: any) => resource.whenValue === props.record[props.column.foreignResource.polymorphicOn]
  )?.allowedActions?.show;
});

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
  white-space: pre-wrap;  
}

.jv-container .jv-button[class] {
  @apply text-lightPrimary;
  @apply dark:text-darkPrimary;

}

.jv-container.jv-dark {
  background: transparent;
}

</style>
