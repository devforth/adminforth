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
      :type="passwordToggle && revealed ? 'text' : type"
      @input="$emit('update:modelValue', type === 'number' ? numberInputValue(($event.target as HTMLInputElement)?.value) : ($event.target as HTMLInputElement)?.value)"
      :value="modelValue"
      aria-describedby="helper-text-explanation"
      :aria-invalid="invalid || undefined"
      class="afcl-input  inline-flex bg-lightInputBackground text-lightInputText dark:text-darkInputText border rounded-0 shadow-customLight focus:outline-none focus:ring-[3px]
      block w-20 px-2.5 py-1.5 leading-5 dark:bg-darkInputBackground placeholder-lightInputPlaceholderText dark:placeholder-darkInputPlaceholderText dark:text-darkInputText translate-y-0 transition-colors disabled:cursor-not-allowed"
      :class="[
        invalid
          ? 'border-lightDanger focus:border-lightDanger focus:ring-lightDanger/20 dark:border-darkDanger dark:focus:border-darkDanger dark:focus:ring-darkDanger/30'
          : 'border-lightInputBorder hover:border-lightInputBorderHover focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:border-darkInputBorder dark:hover:border-darkInputBorderHover dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder',
        {'rounded-l-default': !$slots.prefix && !prefix, 'rounded-r-default': !$slots.suffix && !suffix, 'w-full': fullWidth, 'text-base': isIos, 'text-sm': !isIos, 'pr-10': $slots.rightIcon || passwordToggle },
      ]"
      :disabled="readonly"
    >

    <div v-if="$slots.rightIcon" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="rightIcon" />
    </div>
    <div v-else-if="passwordToggle" class="absolute inset-y-0 right-0 pr-1 flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        class="afcl-input-password-toggle"
        :aria-label="revealed ? $t('Hide password') : $t('Show password')"
        @click="revealed = !revealed"
      >
        <IconEyeOff v-if="revealed" aria-hidden="true" />
        <IconEye v-else aria-hidden="true" />
      </Button>
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
import { IconEye, IconEyeOff } from '@iconify-prerendered/vue-lucide';
import { useCoreStore } from '@/stores/core';
import { numberInputValue } from './inputValue';
import Button from './Button.vue';

const coreStore = useCoreStore();
const isIos = coreStore.isIos;

const props = defineProps<{
  type: string,
  fullWidth?: boolean,
  modelValue: string | number | null,
  suffix?: string,
  prefix?: string,
  readonly?: boolean,
  // paints the border red, e.g. for a value which did not pass validation
  invalid?: boolean,
  // for type="password": a button on the right shows and hides the value
  passwordToggle?: boolean,
}>()

const input = ref<HTMLInputElement | null>(null)
const revealed = ref(false)

defineExpose({
  focus: () => input.value?.focus(),
});

</script>
  