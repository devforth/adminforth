<template>
  <div class="afcl-checkbox flex items-center relative h-5" :class="{'opacity-50' : props.disabled}">
    <div class="flex items-center justify-center">
      <input :id="id" 
        ref="rememberInput"
        type="checkbox"
        :checked="props.modelValue"
        :disabled="props.disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        class="peer appearance-none min-w-4 min-h-4 bg-lightCheckboxBgUnchecked border border-lightCheckboxBorderColor rounded-sm checked:bg-lightCheckboxBgChecked 
                        focus:ring-lightFocusRing dark:focus:ring-darkFocusRing dark:focus:ring-darkFocusRing
                        focus:ring-2 dark:bg-darkCheckboxBgUnchecked dark:border-darkCheckboxBorderColor dark:checked:bg-darkCheckboxBgChecked cursor-pointer"
        >     
        <div class="pointer-events-none absolute text-lightCheckboxIconColor dark:text-darkCheckboxIconColor leading-none peer-checked:block hidden">
          <IconCheckOutline class="w-[1.1rem] h-[1.1rem]" />
        </div> 
    </div>
    <label :for="id" class="ms-2 text-sm font-medium text-lightTextLabel dark:text-darkTextLabel">
      <slot></slot>
    </label>

  </div>
</template>

<script setup lang="ts">
import { IconCheckOutline } from '@iconify-prerendered/vue-flowbite';
const props = defineProps({
  modelValue: Boolean,
  disabled: Boolean,
});

defineEmits(['update:modelValue']);

const id = `afcb-${Math.random().toString(36).substring(7)}`
</script>