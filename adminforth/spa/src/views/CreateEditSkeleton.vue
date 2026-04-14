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
          v-if="isMarkdownEditor(column)"
          class="flex items-start bg-lightForm dark:bg-darkForm border-b border-gray-100 dark:border-darkFormBorder"
        >
          <div class="w-[208px] flex-shrink-0 px-6 pt-7">
            <Skeleton class="w-24 h-[10px]" />
          </div>

          <div class="flex-1 px-6 pt-4 flex flex-col pb-6">
            <div class="flex flex-wrap items-center gap-3 p-1.5 border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800 w-full h-[46px]">
              <template v-for="btn in skeletonButtons" :key="btn.id">
                <div class="animate-pulse flex items-center justify-center h-8 px-1 text-gray-300 dark:text-gray-600">
                  <component :is="btn.icon" class="w-5 h-5" />
                </div>
                <div v-if="btn.sep" class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              </template>
            </div>

            <div class="animate-pulse bg-white dark:bg-gray-950 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg w-full h-[670px]"></div>
          </div>
        </div>

        <div
          v-else
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
import { computed, markRaw } from 'vue';
import {
  IconLinkOutline, IconCodeOutline, IconRectangleListOutline, 
  IconOrderedListOutline, IconLetterBoldOutline, IconLetterUnderlineOutline, 
  IconLetterItalicOutline, IconTextSlashOutline 
} from '@iconify-prerendered/vue-flowbite';
import { IconH116Solid, IconH216Solid, IconH316Solid } from '@iconify-prerendered/vue-heroicons';
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

const isMarkdownEditor = (column: any) => column.name === 'description';

const hasEditingNote = (column: any) => !!column.editingNote;

const getFieldHeight = (column: any) =>
  hasEditingNote(column) ? '95px' : '75px';

const getSkeletonInputClass = (column: any) => {
  if (['integer', 'decimal', 'float'].includes(column.type)) {
    return 'h-[42px] w-[160px]';
  }
  return 'h-[42px] w-full';
};

const skeletonButtons = [
  { id: 'bold', icon: markRaw(IconLetterBoldOutline), sep: false },
  { id: 'italic', icon: markRaw(IconLetterItalicOutline), sep: false },
  { id: 'underline', icon: markRaw(IconLetterUnderlineOutline), sep: false },
  { id: 'strike', icon: markRaw(IconTextSlashOutline), sep: true },
  { id: 'h1', icon: markRaw(IconH116Solid), sep: false },
  { id: 'h2', icon: markRaw(IconH216Solid), sep: false },
  { id: 'h3', icon: markRaw(IconH316Solid), sep: true },
  { id: 'ul', icon: markRaw(IconRectangleListOutline), sep: false },
  { id: 'ol', icon: markRaw(IconOrderedListOutline), sep: false },
  { id: 'link', icon: markRaw(IconLinkOutline), sep: false },
  { id: 'codeBlock', icon: markRaw(IconCodeOutline), sep: false },
];
</script>