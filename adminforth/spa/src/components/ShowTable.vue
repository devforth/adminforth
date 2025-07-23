<template>
      <div :class="`overflow-x-auto ${isRounded ? 'rounded-default' : ''} shadow-resourseFormShadow dark:shadow-darkResourseFormShadow`">
        <div v-if="groupName && !noTitle"  class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-gray-600 text-gray-700 bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
        {{ groupName }}
        </div>
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed">
        <thead v-if="!allColumnsHaveCustomComponent"  class="text-gray-700 dark:text-gray-400 bg-lightFormHeading dark:bg-gray-700 block md:table-row-group">
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
            class="bg-lightForm border-t border-gray-100 
              dark:bg-gray-800 dark:border-gray-700 block md:table-row"
          >
            <component
                v-if="column.components?.showRow"
                  :is="getCustomComponent(column.components.showRow)"
                  :meta="column.components.showRow.meta"
                  :column="column"
                  :resource="coreStore.resource"
                  :record="coreStore.record"
              />
            <template v-else>
              <td class="px-6 py-4 relative block md:table-cell font-bold md:font-normal pb-0 md:pb-4">
                {{ column.label }}
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
  import { getCustomComponent } from '@/utils';
  import { useCoreStore } from '@/stores/core';
  import { computed } from 'vue';
  const props = withDefaults(defineProps<{ 
    columns: Array<{
        name: string;
        label: string;
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
    source: string;
    groupName?: string | null;
    noTitle?: boolean;
    resource: Record<string, any>;
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