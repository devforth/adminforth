<template>
  <div>
    
    <div 
      class="relative shadow-md sm:rounded-lg"
    >
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Field
                </th>
                <th scope="col" class="px-6 py-3 w-4/6">
                    Value
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="column, i in editableColumns" :key="column.name"
                class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                {{ column.label }}
                <span :data-tooltip-target="`tooltip-show-${i}`" class="relative inline-block">
                  <IconExclamationCircleSolid v-if="column.requiredOn.includes(mode)" class="w-4 h-4 text-red-500 dark:text-red-400" />
                </span>
                <div :id="`tooltip-show-${i}`"
                  role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Required field
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap">
                <Dropdown
                  single
                  v-if="column.enum"
                  :options="column.enum"
                  :modelValue="currentValues[column.name]"
                  @update:modelValue="setCurrentValue(column.name, $event)"
                />
                <Dropdown
                  single
                  v-else-if="column.type === 'boolean'"
                  :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Unset', value: null }]"
                  :modelValue="currentValues[column.name]"
                  @update:modelValue="setCurrentValue(column.name, $event)"
                />
                <input 
                  v-else-if="['integer'].includes(column.type)"
                  type="number" 
                  step="1"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="0"
                  :value="currentValues[column.name]"
                  @input="setCurrentValue(column.name, $event.target.value)"
                >
                <input
                  v-else-if="['decimal', 'float'].includes(column.type)"
                  type="number"
                  step="0.1"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="0.0"
                  :value="currentValues[column.name]"
                  @input="setCurrentValue(column.name, $event.target.value)"
                />
                <textarea
                  v-else-if="['text'].includes(column.type)"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Text"
                  :value="currentValues[column.name]"
                  @input="setCurrentValue(column.name, $event.target.value)"
                >
                </textarea>
                <input
                  v-else
                  :type="!column.masked ? 'text' : 'password'"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Text"
                  :value="currentValues[column.name]"
                  @input="setCurrentValue(column.name, $event.target.value)"
                >


                <div v-if="columnError(column)" class="mt-1 text-xs text-red-500 dark:text-red-400">{{ columnError(column) }}</div>

                <div v-if="column.editingNote" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ column.editingNote }}</div>
              </td>
            </tr>
            
        </tbody>
      </table>

    </div>
  </div>

</template>

<script setup>

import { ref, computed, onMounted, watch } from 'vue';
import { useCoreStore } from '@/stores/core';
import Dropdown from '@/components/Dropdown.vue';
import { IconExclamationCircleSolid } from '@iconify-prerendered/vue-flowbite';
import { initFlowbite } from 'flowbite'

const props = defineProps({
  loading: Boolean,
  resourceColumns: Object,
  record: Object,
});

const mode = computed(() => props.record ? 'edit' : 'create');

const emit = defineEmits(['update:record']);

const currentValues = ref({});

const columnError = (column) => {
  const val = computed(() => {
    if ( column.requiredOn.includes(mode.value) && (currentValues.value[column.name] === undefined || currentValues.value[column.name] === null || currentValues.value[column.name] === '') ) {
      return 'This field is required';
    }
    if ( column.type === 'string' || column.type === 'text' ) {
      if ( column.maxLength && currentValues.value[column.name]?.length > column.maxLength ) {
        return `This field must be shorter than ${column.maxLength} characters`;
      }
      if ( column.minLength && currentValues.value[column.name]?.length < column.minLength ) {
        return `This field must be longer than ${column.minLength} characters`;
      }
    }
    if ( ['integer', 'decimal', 'float'].includes(column.type) ) {
      if ( column.minValue !== undefined && currentValues.value[column.name] < column.minValue ) {
        return `This field must be greater than ${column.minValue}`;
      }
      if ( column.maxValue !== undefined && currentValues.value[column.name] > column.maxValue ) {
        return `This field must be less than ${column.maxValue}`;
      }
    }
    return null;
  });
  console.log('val', JSON.stringify(val.value));
  return val.value;
};

const setCurrentValue = (key, value) => {
  currentValues.value[key] = value;

  emit('update:record', currentValues.value);
};

onMounted(() => {
  Object.keys(props.record).forEach((key) => {
    currentValues.value[key] = props.record[key];
  });
  initFlowbite();
});

const coreStore = useCoreStore();

const editableColumns = computed(() => {
  const mode = props.record ? 'edit' : 'create';
  return props.resourceColumns?.filter(column => column.showIn.includes(mode));
});

</script>
