<template>
  <div class="afcl-checkbox flex items-center relative h-5" :class="{'opacity-50' : props.disabled}">
    <div class="flex items-center justify-center">
      <input :id="id" 
        ref="rememberInput"
        type="checkbox"
        :checked="props.modelValue"
        :disabled="props.disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        class="peer appearance-none min-w-4 min-h-4 bg-lightCheckboxBgUnchecked border border-lightCheckboxBorderColor rounded shadow-customLight checked:bg-lightCheckboxBgChecked checked:border-lightCheckboxBgChecked
                        focus:outline-none focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing
                        focus-visible:ring-[3px] focus-visible:ring-offset-0 dark:bg-darkCheckboxBgUnchecked dark:border-darkCheckboxBorderColor dark:checked:bg-darkCheckboxBgChecked dark:checked:border-darkCheckboxBgChecked cursor-pointer transition-colors"
        >     
        <div class="pointer-events-none absolute text-lightCheckboxIconColor dark:text-darkCheckboxIconColor leading-none peer-checked:block hidden">
          <IconCheck class="w-3 h-3 [&_g]:[stroke-width:3]" />
        </div> 
    </div>
    <label :for="id" class="ms-2 text-sm text-lightTextLabel dark:text-darkTextLabel">
      <slot></slot>
    </label>

  </div>
</template>

<script setup lang="ts">
import { IconCheck } from '@iconify-prerendered/vue-lucide';
const props = defineProps({
  modelValue: Boolean,
  disabled: Boolean,
});

defineEmits(['update:modelValue']);

const id = `afcb-${Math.random().toString(36).substring(7)}`
</script>