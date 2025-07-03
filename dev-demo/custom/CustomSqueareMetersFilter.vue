<template>
  <div class="flex flex-col gap-2">
    <!-- Label for the filter section -->
    <p class="font-medium mb-1 dark:text-white">{{ $t('Square meters filter') }}</p>

    <!-- Button group for filter options -->
    <div class="flex gap-2">
      <button
        :class="[
          baseBtnClass,
          selected === 'small' ? activeBtnClass : inactiveBtnClass
        ]"
        @click="select('small')"
        type="button"
      >
        {{ $t('Small (<25)') }}
      </button>
      <button
        :class="[
          baseBtnClass,
          selected === 'medium' ? activeBtnClass : inactiveBtnClass
        ]"
        @click="select('medium')"
        type="button"
      >
        {{ $t('Medium (25–90)') }}
      </button>
      <button
        :class="[
          baseBtnClass,
          selected === 'large' ? activeBtnClass : inactiveBtnClass
        ]"
        @click="select('large')"
        type="button"
      >
        {{ $t('Large (>90)') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  modelValue: Array<{ operator: string; value: number }> | null;
}>();

// Track selected filter option
const selected = ref<string | null>(null);

// Button classes
const baseBtnClass =
  'flex gap-1 items-center py-1 px-3 text-sm font-medium rounded-default border focus:outline-none focus:z-10 focus:ring-4';
const activeBtnClass =
  'text-white bg-blue-500 border-blue-500 hover:bg-blue-600 focus:ring-blue-200 dark:focus:ring-blue-800';
const inactiveBtnClass =
  'text-gray-900 bg-white border-gray-300 hover:bg-gray-100 hover:text-blue-500 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700';

// Watch for external changes to the modelValue prop and update selected button accordingly
watch(
  () => props.modelValue,
  (val) => {
    if (!val || val.length === 0) {
      selected.value = null;
      return;
    }

    const ops = val.map((v) => `${v.operator}:${v.value}`);

    if (ops.includes('lt:25')) selected.value = 'small';
    else if (ops.includes('gte:25') && ops.includes('lte:90')) selected.value = 'medium';
    else if (ops.includes('gt:90')) selected.value = 'large';
    else selected.value = null;
  },
  { immediate: true }
);

// Emit corresponding value array depending on selected size
function select(size: string) {
  selected.value = size;

  switch (size) {
    case 'small':
      emit('update:modelValue', [{ operator: 'lt', value: 25 }]);
      break;
    case 'medium':
      emit('update:modelValue', [
        { operator: 'gte', value: 25 },
        { operator: 'lte', value: 90 }
      ]);
      break;
    case 'large':
      emit('update:modelValue', [{ operator: 'gt', value: 90 }]);
      break;
  }
}
</script>
