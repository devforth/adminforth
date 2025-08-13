<template>
  <div 
    role="status" class="max-w-sm animate-pulse"
  >
      <div class="h-2.5 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor w-48 mb-4"></div>
      <div class="h-2 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor max-w-[360px] mb-2.5"></div>
      <div class="h-2 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor mb-2.5"></div>
      <div class="h-2 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor max-w-[330px] mb-2.5"></div>
      <div class="h-2 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor max-w-[300px] mb-2.5"></div>
      <div class="h-2 bg-lightSkeletonBackgroundColor rounded-full dark:bg-darkSkeletonBackgroundColor max-w-[360px]"></div>
      <span class="sr-only">{{ $t('Loading...') }}</span>
    </div>
</template>