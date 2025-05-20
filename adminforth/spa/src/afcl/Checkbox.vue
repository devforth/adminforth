<template>
  <div class="flex items-center h-5" :class="{'opacity-50' : props.disabled}">
    <input :id="id" 
      ref="rememberInput"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
      class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-lightPrimary cursor-pointer 
        focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 checked:bg-lightPrimary checked:dark:bg-darkPrimary" /> 
  </div>
  <label :for="id" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
    <slot></slot>
  </label>
</template>

<script setup lang="ts">

const props = defineProps({
  modelValue: Boolean,
  disabled: Boolean,
});

defineEmits(['update:modelValue']);

const id = `afcb-${Math.random().toString(36).substring(7)}`
</script>