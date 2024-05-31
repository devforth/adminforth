<template>
  <div>
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
