<template>

  <div class="afcl-input-wrapper flex z-0 relative" :class="{'opacity-50' : readonly}">
    <span
        v-if="$slots.prefix || prefix"
        class="inline-flex items-center px-3 text-sm text-lightInputText bg-lightInputBackground border border-s-0 border-lightInputBorder rounded-s-md dark:bg-darkInputBackground dark:text-darkInputText dark:border-darkInputBorder">
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <!-- translate needed for bumping ring above prefix without z-index -->
    <input
      ref="input"
      v-bind="$attrs"
      :type="type"
      @input="$emit('update:modelValue', type === 'number' ? Number(($event.target as HTMLInputElement)?.value) : ($event.target as HTMLInputElement)?.value)"
      :value="modelValue"
      aria-describedby="helper-text-explanation"
      class="afcl-input  inline-flex bg-lightInputBackground text-lightInputText dark:text-darkInputText border border-lightInputBorder rounded-0 focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary 
      blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-darkInputBackground dark:border-darkInputBorder placeholder-lightInputPlaceholderText dark:placeholder-darkInputPlaceholderText dark:text-darkInputText translate-y-0"
      :class="{'rounded-l-md': !$slots.prefix && !prefix, 'rounded-r-md': !$slots.suffix && !suffix, 'w-full': fullWidth, 'text-base': isIos, 'text-sm': !isIos }"
      :disabled="readonly"
    >

    <div v-if="$slots.rightIcon" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="rightIcon" />
    </div>
    <span
        v-if="$slots.suffix || suffix"
        class="inline-flex items-center px-3 text-sm text-lightInputText bg-lightInputBackground border border-s-0 border-lightInputBorder rounded-e-md dark:bg-darkInputBackground dark:text-darkInputText dark:border-darkInputBorder ">
      <slot name="suffix">{{ suffix }}</slot>
    </span>
    
  </div>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();
const isIos = coreStore.isIos;

const props = defineProps<{
  type: string,
  fullWidth: boolean,
  modelValue: string,
  suffix?: string,
  prefix?: string,
  readonly?: boolean,
}>()

const input = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => input.value?.focus(),
});

</script>
  