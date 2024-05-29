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
                <th scope="col" class="px-6 py-3">
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
                  <IconExclamationCircleSolid v-if="column.required" class="text-red-500" />
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
                  :value="currentValues[column.name]"
                  @update:modelValue="setCurrentValue(column.name, $event)"
                />
                <Dropdown
                  single
                  v-else-if="column.type === 'boolean'"
                  :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Unset', value: null }]"
                  :value="currentValues[column.name]"
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
                  type="text"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Text"
                  :value="currentValues[column.name]"
                  @input="setCurrentValue(column.name, $event.target.value)"
                >

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

const emit = defineEmits(['update:record']);

const currentValues = ref({});

const setCurrentValue = (key, value) => {
  currentValues[key] = value;
  emit('update:record', currentValues);
};

onMounted(() => {
  console.log('props.record👌', props.record);

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
