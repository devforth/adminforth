<template>
      <div class="overflow-x-auto shadow-resourseFormShadow dark:shadow-darkResourseFormShadow"
        :class="{'rounded-default' : isRounded}"
      >
        <div v-if="groupName && !noTitle"  class="text-md font-semibold px-6 py-3 flex flex-1 items-center text-lightShowTableHeadingText bg-lightShowTableHeadingBackground dark:bg-darkShowTableHeadingBackground  dark:text-darkShowTableHeadingText rounded-t-lg">
        {{ groupName }}
        </div>
      <table class="w-full text-sm text-left rtl:text-right text-lightShowTableBodyText dark:text-darkShowTableBodyText table-fixed">
        <thead v-if="!allColumnsHaveCustomComponent"  class="text-lightShowTableUnderHeadingText dark:text-darkShowTableUnderHeadingText bg-lightShowTableUnderHeadingBackground dark:bg-darkShowTableUnderHeadingBackground dark:border-darkFormBorder block md:table-row-group">
          <tr>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:w-52 md:table-cell">
              {{ $t('Field') }}
            </th>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:table-cell">
              {{ $t('Value') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="column in columns"
            :key="column.name"
            class="bg-lightShowTablesBodyBackground border-t border-lightShowTableBodyBorder 
              dark:bg-darkShowTablesBodyBackground dark:border-darkShowTableBodyBorder block md:table-row"
          >
            <component
                v-if="column.components?.showRow && checkShowIf(column, record, resource?.columns || [])"
                  :is="getCustomComponent(column.components.showRow)"
                  :meta="column.components.showRow.meta"
                  :column="column"
                  :resource="coreStore.resource"
                  :record="coreStore.record"
              />
            <template v-else-if="checkShowIf(column, record, resource?.columns || [])">
              <td class="px-6 py-4 relative block flex justify-start font-bold md:font-normal pb-0 md:pb-4 relative md:table-cell">
                <div class="absolute inset-0 flex items-center overflow-hidden px-6 py-4 max-h-32">
                  {{ column.label }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-pre-wrap" :data-af-column="column.name">
                <component
                  v-if="column?.components?.show"
                  :is="getCustomComponent(column?.components?.show)"
                  :resource="resource"
                  :meta="column.components.show.meta"
                  :column="column"
                  :record="record"
                />
                <ValueRenderer
                  v-else
                  :column="column"
                  :record="record"
                />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup lang="ts">
  import ValueRenderer from '@/components/ValueRenderer.vue';
  import { getCustomComponent, checkShowIf } from '@/utils';
  import { useCoreStore } from '@/stores/core';
  import { computed } from 'vue';
  import type { AdminForthResourceCommon, AdminForthResourceColumnInputCommon } from '@/types/Common';
  const props = withDefaults(defineProps<{ 
    columns: Array<{
        name: string;
        label?: string;
        showIf?: AdminForthResourceColumnInputCommon['showIf'];
        components?: {
          show?: {
            file: string;
            meta: Record<string, any>;
          };
          showRow?: {
            file: string;
            meta: Record<string, any>;
          };
        };
    }>;
    groupName?: string | null;
    noTitle?: boolean;
    resource: AdminForthResourceCommon | null;
    record: Record<string, any>;
    isRounded?: boolean;
  }>(), {
    isRounded: true
  });
  
  const coreStore = useCoreStore();
  const allColumnsHaveCustomComponent = computed(() => {
    return props.columns.every(column => {
      return column.components?.showRow;
    });
  });
  </script>