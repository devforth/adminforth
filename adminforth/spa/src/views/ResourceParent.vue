<template>
  <div :key="`${$route?.params.resourceId}---${$route?.params.primaryKey}`" class="p-4 h-[calc(100vh-3.5rem)] flex" >
    <RouterView/>
  </div>
</template>

<style>
</style>

<script setup>


import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore()

</script>
