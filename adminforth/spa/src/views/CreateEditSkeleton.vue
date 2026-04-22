<template>
  <div class="w-full mt-[36px]">
    <div class="w-full border dark:border-darkFormBorder border-gray-200 rounded-lg overflow-hidden shadow-resourseFormShadow dark:shadow-darkResourseFormShadow bg-white dark:bg-darkForm">
      
      <div class="flex px-6 items-center border-b border-gray-200 dark:border-darkFormBorder bg-lightFormHeading dark:bg-darkFormHeading h-[40px]">
        <div class="w-[208px] flex-shrink-0 pr-6 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Field') }}
        </div>
        <div class="flex-1 text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText font-bold">
          {{ $t('Value') }}
        </div>
      </div>

      <div
        v-for="i in 10"
        :key="i"
        class="flex items-center bg-lightForm dark:bg-darkForm border-b border-gray-100 dark:border-darkFormBorder h-[75px]"
      >
        <div class="w-[208px] flex-shrink-0 px-6 flex items-center">
          <Skeleton class="w-24 h-[10px]" />
        </div>

        <div class="flex-1 px-6">
          <Skeleton  class="h-[10px] w-full" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from '@/afcl';
</script>