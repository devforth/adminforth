<template>
  <div>
    <RouterView/>
  </div>
</template>

<style>
</style>

<script setup>

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore()

</script>
