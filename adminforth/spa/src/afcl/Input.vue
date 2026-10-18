<template>

  <div class="afcl-input-wrapper flex z-0 relative" :class="{'opacity-50' : readonly}">
    <span
        v-if="$slots.prefix || prefix"
        class="inline-flex items-center px-2.5 text-sm text-lightInputIconColor bg-lightSecondaryDarken border border-e-0 border-lightInputBorder rounded-s-default dark:bg-darkSecondaryLighten dark:text-darkInputIconColor dark:border-darkInputBorder">
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <!-- translate needed for bumping ring above prefix without z-index -->
    <input
      ref="input"
      v-bind="$attrs"
      :type="type"
      @input="$emit('update:modelValue', type === 'number' ? numberInputValue(($event.target as HTMLInputElement)?.value) : ($event.target as HTMLInputElement)?.value)"
      :value="modelValue"
      aria-describedby="helper-text-explanation"
      class="afcl-input  inline-flex bg-lightInputBackground text-lightInputText dark:text-darkInputText border border-lightInputBorder rounded-0 shadow-customLight hover:border-lightInputBorderHover focus:outline-none focus:ring-[3px] focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:hover:border-darkInputBorderHover dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder 
      block w-20 px-2.5 py-1.5 leading-5 dark:bg-darkInputBackground dark:border-darkInputBorder placeholder-lightInputPlaceholderText dark:placeholder-darkInputPlaceholderText dark:text-darkInputText translate-y-0 transition-colors disabled:cursor-not-allowed"
      :class="{'rounded-l-default': !$slots.prefix && !prefix, 'rounded-r-default': !$slots.suffix && !suffix, 'w-full': fullWidth, 'text-base': isIos, 'text-sm': !isIos, 'pr-10': $slots.rightIcon }"
      :disabled="readonly"
    >

    <div v-if="$slots.rightIcon" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="rightIcon" />
    </div>
    <span
        v-if="$slots.suffix || suffix"
        class="inline-flex items-center px-2.5 text-sm text-lightInputIconColor bg-lightSecondaryDarken border border-s-0 border-lightInputBorder rounded-e-default dark:bg-darkSecondaryLighten dark:text-darkInputIconColor dark:border-darkInputBorder ">
      <slot name="suffix">{{ suffix }}</slot>
    </span>
    
  </div>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { useCoreStore } from '@/stores/core';
import { numberInputValue } from './inputValue';

const coreStore = useCoreStore();
const isIos = coreStore.isIos;

const props = defineProps<{
  type: string,
  fullWidth?: boolean,
  modelValue: string | number | null,
  suffix?: string,
  prefix?: string,
  readonly?: boolean,
}>()

const input = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => input.value?.focus(),
});

</script>
  