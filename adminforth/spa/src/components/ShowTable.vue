<template>
    <div class="overflow-x-auto rounded-default shadow-resourseFormShadow dark:shadow-darkResourseFormShadow">
        <div v-if="groupName" class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-gray-600 text-gray-700 bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
        {{ groupName }}
        </div>
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed mb-4">
        <thead class="text-gray-700 dark:text-gray-400 bg-lightFormHeading dark:bg-gray-700 block md:table-row-group">
          <tr>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:w-52 md:table-cell">
              Field
            </th>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:table-cell">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="column in columns"
            :key="column.name"
            class="bg-lightForm bg-darkForm odd:dark:bg-gray-900 even:dark:bg-gray-800 dark:border-gray-700 block md:table-row"
          >
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
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps } from 'vue';
  import ValueRenderer from '@/components/ValueRenderer.vue';
  import { getCustomComponent } from '@/utils';

  defineProps<{ 
    columns: Array<{
        name: string;
        label: string;
        components?: {
        show?: {
            meta: Record<string, any>;
        };
        };
    }>;
    groupName?: string | null;
    resource: Record<string, any>;
    record: Record<string, any>;
  }>();
  </script>