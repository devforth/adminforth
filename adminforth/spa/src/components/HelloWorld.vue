<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      {{ $t('You’ve successfully created a project with') }}
    </h3>
  </div>
</template>

<style scoped>
</style>