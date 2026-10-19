<template>
  <div class="w-full mt-[36px]">
    <div class="w-full border dark:border-darkFormBorder border-lightFormBorder rounded-lg overflow-hidden shadow-resourseFormShadow dark:shadow-darkResourseFormShadow bg-lightForm dark:bg-darkForm divide-y divide-lightShowTableBodyBorder dark:divide-darkShowTableBodyBorder">
      <div
        v-for="i in 10"
        :key="i"
        class="flex items-center h-[58px]"
      >
        <div class="w-56 flex-shrink-0 px-5 flex items-center">
          <Skeleton class="w-24 h-[10px]" />
        </div>

        <div class="flex-1 px-5">
          <Skeleton class="h-[10px] w-full max-w-xl" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from '@/afcl';
</script>
