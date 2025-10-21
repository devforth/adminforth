<template>
  <router-link 
    v-bind="$attrs"
    :to="props.to"
    type="submit" 
    class="afcl-link-button flex items-center justify-center gap-1 text-lightButtonsText bg-lightButtonsBackground border border-lightButtonsBorder dark:bg-darkButtonsBackground hover:bg-lightButtonsHover hover:border-lightButtonsBorderHover
      focus:ring-4 focus:outline-none focus:ring-lightButtonFocusRing focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-darkButtonFocusRing dark:text-darkButtonsText dark:border-darkButtonsBorder dark:hover:bg-darkButtonsHover dark:hover:border-darkButtonsBorderHover"
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
  disabled?: boolean,
  to: string,
}>();

</script>