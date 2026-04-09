<template>
  <div class="w-full mt-[36px] animate-pulse">
    <div class="w-full border dark:border-darkFormBorder border-gray-200 rounded-lg overflow-hidden shadow-resourseFormShadow dark:shadow-darkResourseFormShadow bg-white dark:bg-darkForm">
      
      <div class="flex px-6 items-center border-b border-gray-200 dark:border-darkFormBorder bg-lightFormHeading dark:bg-darkFormHeading" style="height: 40px;">
        <div class="w-[208px] flex-shrink-0 pr-6 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Field') }}
        </div>
        <div class="flex-1 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Value') }}
        </div>
      </div>

      <div v-for="i in 5" :key="i" 
        class="flex items-center bg-lightForm dark:bg-darkForm border-b border-gray-100 dark:border-darkFormBorder"
        :style="{ height: i === 2 ? '95px' : '75px' }"
      >
          <div class="w-[208px] flex-shrink-0 px-6 flex items-center gap-1">
            <div class="h-[10px] bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
          </div>
          
          <div class="flex-1 px-6"> 
            <div v-if="i === 2">
              <div class="h-[42px] bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 w-[160px]"></div>
              <div class="mt-1 h-[12px] bg-gray-100 dark:bg-gray-800 rounded w-20"></div>
            </div>
            <div v-else-if="i === 4 || i === 5" class="h-[42px] bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 w-[160px]"></div>
            <div v-else class="h-[42px] bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 w-full "></div>
          </div>
      </div>

      <div class="flex items-start bg-lightForm dark:bg-darkForm" style="height: 759px;">
        <div class="w-[208px] flex-shrink-0 px-6 pt-7">
          <div class="h-[10px] bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        
        <div class="flex-1 px-6 pt-4 h-full flex flex-col">
          <div class="flex flex-wrap items-center gap-3 p-1.5 border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800 w-full box-border h-[44px]">
            <template v-for="btn in skeletonButtons" :key="btn.id">
              <div class="flex items-center justify-center h-8 px-1 text-gray-300 dark:text-gray-600">
                <component :is="btn.icon" class="w-5 h-5" />
              </div>
              <div v-if="btn.sep" class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            </template>
          </div>
          <div class="flex-1 bg-white dark:bg-gray-950 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg w-full shadow-inner"></div>
          <div class="h-10"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue';
import { IconExclamationCircleSolid } from '@iconify-prerendered/vue-flowbite';
import { 
  IconLinkOutline, IconCodeOutline, IconRectangleListOutline, 
  IconOrderedListOutline, IconLetterBoldOutline, IconLetterUnderlineOutline, 
  IconLetterItalicOutline, IconTextSlashOutline 
} from '@iconify-prerendered/vue-flowbite';
import { IconH116Solid, IconH216Solid, IconH316Solid } from '@iconify-prerendered/vue-heroicons';

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