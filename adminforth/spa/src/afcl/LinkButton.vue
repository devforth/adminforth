<template>
  <router-link 
    v-bind="$attrs"
    :to="props.to"
    type="submit" 
    class="afcl-link-button flex items-center justify-center gap-1 text-lightPrimaryContrast bg-lightPrimary dark:bg-darkPrimary hover:brightness-110 
      focus:ring-4 focus:outline-none focus:ring-lightPrimary focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-darkPrimary dark:focus:ring-opacity-50"
    :class="{
      'cursor-default': props.disabled,
      'opacity-50': props.disabled,
      'pointer-events-none': props.disabled,
    }"
  >
    <slot></slot>
  </router-link>
</template>

<script setup lang="ts">

const props = defineProps<{
  disabled: boolean,
  to: string,
}>();

</script>