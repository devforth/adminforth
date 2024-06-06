<template>
  <div :key="`${$route?.params.resourceId}---${$route?.params.primaryKey}`">
    <RouterView/>
  </div>
</template>

<style>
</style>

<script setup>


import { useCoreStore } from '@/stores/core';
import { onMounted } from 'vue';

const coreStore = useCoreStore()

</script>
