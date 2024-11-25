<template>
  <router-link 
    v-bind="$attrs"
    :to="to"
    class="text-lightPrimary underline dark:text-darkPrimary hover:no-underline hover:brightness-110
      cursor-pointer"
  >
    <slot></slot>
  </router-link>
</template>

<script setup lang="ts">

defineProps<{
  to: string,
}>()
</script>