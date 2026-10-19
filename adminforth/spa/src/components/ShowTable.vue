<template>
      <div class="overflow-x-auto overscroll-x-contain shadow-resourseFormShadow dark:shadow-darkResourseFormShadow border border-lightFormBorder dark:border-darkFormBorder bg-lightShowTablesBodyBackground dark:bg-darkShowTablesBodyBackground"
        :class="{'rounded-lg' : isRounded}"
      >
        <div v-if="groupName && !noTitle" class="px-5 pt-4 pb-1 text-sm font-semibold text-lightShowTableHeadingText dark:text-darkShowTableHeadingText">
        {{ groupName }}
        </div>
      <table class="w-full text-sm text-left rtl:text-right text-lightShowTableBodyText dark:text-darkShowTableBodyText table-fixed">
        <colgroup>
          <col class="md:w-56">
          <col>
        </colgroup>
        <tbody class="divide-y divide-lightShowTableBodyBorder dark:divide-darkShowTableBodyBorder">
          <tr
            v-for="column in visibleColumns"
            :key="column.name"
            class="block md:table-row"
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
              <td class="px-5 pt-2.5 pb-0 md:pb-2.5 block md:table-cell align-top text-[13px] text-lightInputIconColor dark:text-darkInputIconColor">
                {{ column.label }}
              </td>
              <td class="px-5 pt-1 pb-2.5 md:pt-2.5 block md:table-cell whitespace-pre-wrap" :data-af-column="column.name">
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
  import type { AdminForthResourceFrontend, AdminForthResourceColumnInputCommon } from '@/types/Common';
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
    resource: AdminForthResourceFrontend | null;
    record: Record<string, any>;
    isRounded?: boolean;
  }>(), {
    isRounded: true
  });

  const coreStore = useCoreStore();
  // hidden columns render no row, so the dividers between rows never double up
  const visibleColumns = computed(() => {
    return props.columns.filter(column => checkShowIf(column, props.record, props.resource?.columns || []));
  });
  </script>
