<template> 

    <textarea
      ref="input"
      class="bg-lightInputBackground border border-lightInputBorder text-lightInputText placeholder-lightInputPlaceholderText text-sm rounded-lg block w-full p-2.5 dark:bg-darkInputBackground dark:border-darkInputBorder dark:placeholder-darkInputPlaceholderText dark:text-darkInputText dark:border-darkInputBorder focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :readonly="readonly"
    />

</template>

<script setup lang="ts">

import { ref } from 'vue';

const props = defineProps<{
  modelValue: string,
  readonly?: boolean,
  placeholder?: string,
}>()

const input = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => input.value?.focus(),
});

</script>
  