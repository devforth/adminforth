<template>
  <div class="w-full mt-[36px]">
    <div class="w-full border dark:border-darkFormBorder border-gray-200 rounded-lg overflow-hidden shadow-resourseFormShadow dark:shadow-darkResourseFormShadow bg-white dark:bg-darkForm">
      
      <div class="flex px-6 items-center border-b border-gray-200 dark:border-darkFormBorder bg-lightFormHeading dark:bg-darkFormHeading" style="height: 40px;">
        <div class="w-[208px] flex-shrink-0 pr-6 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Field') }}
        </div>
        <div class="flex-1 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Value') }}
        </div>
      </div>

      <template v-for="column in visibleColumns" :key="column.name">
        <div
          class="flex items-center bg-lightForm dark:bg-darkForm border-b border-gray-100 dark:border-darkFormBorder"
          :style="{ height: getFieldHeight(column) }"
        >
          <div class="w-[208px] flex-shrink-0 px-6 flex items-center">
            <Skeleton class="w-24 h-[10px]" />
          </div>

          <div class="flex-1 px-6">
            <Skeleton type="input" :class="getSkeletonInputClass(column)" />

            <div v-if="hasEditingNote(column)" class="mt-1">
              <Skeleton class="h-[12px] w-20" />
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Skeleton } from '@/afcl';

interface Props {
  resource?: any;
  page?: string;}

const props = withDefaults(defineProps<Props>(), {
  page: 'edit'
});

const visibleColumns = computed(() => {
  if (!props.resource?.columns) return [];

  return props.resource.columns.filter((col: any) => {
    if (col.virtual) return false;
    if (col.primaryKey) return false;
    if (col.backendOnly) return false;
    if (col.showIn?.[props.page] === false) return false;
    return true;
  });
});


const hasEditingNote = (column: any) => !!column.editingNote;

const getFieldHeight = (column: any) =>
  hasEditingNote(column) ? '95px' : '75px';

const getSkeletonInputClass = (column: any) => {
  if (['integer', 'decimal', 'float'].includes(column.type)) {
    return 'h-[42px] w-[160px]';
  }
  return 'h-[42px] w-full';
};

</script>