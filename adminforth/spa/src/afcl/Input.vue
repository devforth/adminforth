<template>

  <div class="flex z-0">
    <span
        v-if="$slots.prefix || prefix"
        class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-s-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <!-- translate needed for bumping ring above prefix without z-index -->
    <input
      v-bind="$attrs"
      :type="type"
      @input="$emit('update:modelValue', $event.target?.value)"
      :value="modelValue"
      aria-describedby="helper-text-explanation"
      class="inline-flex bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-0 focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary 
      blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white translate-y-0"
      :class="{'rounded-l-md': !$slots.prefix && !prefix, 'rounded-r-md': !$slots.suffix && !suffix, 'w-full': fullWidth}"
    >


    <span
        v-if="$slots.suffix || suffix"
        class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-s-0 border-gray-300 rounded-e-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 ">
      <slot name="suffix">{{ suffix }}</slot>
    </span>
    
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  type: String,
  fullWidth: Boolean,
  modelValue: String,
  suffix: String,
  prefix: String,
})


</script>
  