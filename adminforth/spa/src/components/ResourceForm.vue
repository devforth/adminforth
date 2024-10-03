<template>
  <div class="rounded-default">
    <div 
      class="relative shadow-resourseFormShadow dark:shadow-darkResourseFormShadow sm:rounded-lg dark:shadow-2xl  rounded-default"
    >
      <form autocomplete="off" @submit.prevent>
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 ">
          <thead class="text-xs text-gray-700 uppercase bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 block md:table-row-group">
            <tr>
              <th scope="col" class="px-6 py-3 hidden md:table-cell">
                  Field
              </th>
              <th scope="col" class="px-6 py-3 w-5/6 hidden md:table-cell">
                  Value
              </th>
            </tr>
          </thead>
          <tbody>
              <tr v-for="column, i in editableColumns" :key="column.name"
                  v-if="currentValues !== null"
                  class="bg-ligftForm dark:bg-gray-800 dark:border-gray-700 block md:table-row"
                  :class="{ 'border-b': i !== editableColumns.length - 1 }"
              >
                    <td class="px-6 py-4 sm:pb-0 whitespace-nowrap flex items-center block md:table-cell"> <!--align-top-->
                      {{ column.label }}
                      <span :data-tooltip-target="`tooltip-show-${i}`" class="ml-1 relative inline-block">
                          <IconExclamationCircleSolid v-if="column.required[mode]" class="w-4 h-4" 
                          :class="(columnError(column) && validating) ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'"
                          />
                      </span>
                      <div :id="`tooltip-show-${i}`"
                          role="tooltip" 
                          class="ml-1 absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                          Required field
                          <div class="tooltip-arrow" data-popper-arrow></div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap relative block md:table-cell">
                    <template v-if="column?.components?.[props.source]?.file">
                      <component
                        :is="getCustomComponent(column.components[props.source])"
                        :column="column"
                        :value="currentValues[column.name]"
                        @update:value="setCurrentValue(column.name, $event)"
                        :meta="column.components[props.source].meta"
                        :record="currentValues"
                        @update:inValidity="customComponentsInValidity[column.name] = $event"
                        @update:emptiness="customComponentsEmptiness[column.name] = $event"
                      />
                    </template>
                    <template v-else>
                      <Dropdown
                          single
                          v-if="column.foreignResource"
                          :options="columnOptions[column.name] || []"
                          :placeholder = "columnOptions[column.name]?.length ?'Select...': 'There are no options available'"
                          :modelValue="currentValues[column.name]"
                          @update:modelValue="setCurrentValue(column.name, $event)"
                      ></Dropdown>
                      <Dropdown
                          single
                          v-else-if="column.enum"
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
                      <CustomDatePicker
                          v-else-if="['datetime'].includes(column.type)"
                          :column="column"
                          :valueStart="currentValues[column.name]"
                          auto-hide
                          @update:valueStart="setCurrentValue(column.name, $event)"
                      />
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
                          v-else-if="['text', 'richtext'].includes(column.type)"
                          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Text"
                          :value="currentValues[column.name]"
                          @input="setCurrentValue(column.name, $event.target.value)"
                      >
                      </textarea>
                      <input
                          v-else
                          :type="!column.masked || unmasked[column.name] ? 'text' : 'password'"
                          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Text"
                          :value="currentValues[column.name]"
                          @input="setCurrentValue(column.name, $event.target.value)"
                          autocomplete="false"
                          data-lpignore="true"
                          readonly
                          onfocus="this.removeAttribute('readonly');"
                      >

                      <button
                          v-if="column.masked"
                          type="button"
                          @click="unmasked[column.name] = !unmasked[column.name]"
                          class="h-6 absolute inset-y-2 top-6 right-6 flex items-center pr-2 z-index-100 focus:outline-none"
                      >
                          <IconEyeSolid class="w-6 h-6 text-gray-400"  v-if="!unmasked[column.name]" />
                          <IconEyeSlashSolid class="w-6 h-6 text-gray-400" v-else />
                      </button>
                    </template>
                    <div v-if="columnError(column) && validating" class="mt-1 text-xs text-red-500 dark:text-red-400">{{ columnError(column) }}</div>
                    <div v-if="column.editingNote && column.editingNote[mode]" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ column.editingNote[mode] }}</div>

                </td>
              </tr>
              
          </tbody>
        </table>
      </form>
    </div>
  </div>

</template>

<script setup>

import CustomDatePicker from "@/components/CustomDatePicker.vue";
import Dropdown from '@/components/Dropdown.vue';
import { applyRegexValidation, callAdminForthApi, getCustomComponent } from '@/utils';
import { IconExclamationCircleSolid, IconEyeSlashSolid, IconEyeSolid } from '@iconify-prerendered/vue-flowbite';
import { computedAsync } from '@vueuse/core';
import { initFlowbite } from 'flowbite';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  loading: Boolean,
  resource: Object,
  record: Object,
  validating: Boolean,
  source: String,
});

const unmasked = ref({});

const mode = computed(() => route.name === 'resource-create' ? 'create' : 'edit');

const emit = defineEmits(['update:record', 'update:isValid']);

const currentValues = ref(null);

const customComponentsInValidity = ref({});
const customComponentsEmptiness = ref({});
  

const columnError = (column) => {
  const val = computed(() => {
    if (!currentValues.value) {
      return null;
    }
    if (customComponentsInValidity.value[column.name]) {
      return customComponentsInValidity.value[column.name];
    }

    if ( 
      column.required[mode.value] && 
      (currentValues.value[column.name] === undefined || currentValues.value[column.name] === null || currentValues.value[column.name] === '') && 
      // if component is custum it might tell other criteria for emptiness by emitting 'update:emptiness'
      // components which do not emit 'update:emptiness' will have undefined value in customComponentsEmptiness
      (customComponentsEmptiness.value[column.name] !== false)
    
    ) {
      return 'This field is required';
    }
    if ( column.type === 'string' || column.type === 'text' ) {
      if ( column.maxLength && currentValues.value[column.name]?.length > column.maxLength ) {
        return `This field must be shorter than ${column.maxLength} characters`;
      }
      
      if ( column.minLength && currentValues.value[column.name]?.length < column.minLength ) {
        // if column.required[mode.value] is false, then we check if the field is empty
        let needToCheckEmpty = column.required[mode.value] || currentValues.value[column.name]?.length > 0;
        if (!needToCheckEmpty) {
          return null;
        }
        return `This field must be longer than ${column.minLength} characters`;
      }
    }
    if ( ['integer', 'decimal', 'float'].includes(column.type) ) {
      if ( column.minValue !== undefined 
        && currentValues.value[column.name] !== null 
        && currentValues.value[column.name] < column.minValue 
      ) {
        return `This field must be greater than ${column.minValue}`;
      }
      if ( column.maxValue !== undefined && currentValues.value[column.name] > column.maxValue ) {
        return `This field must be less than ${column.maxValue}`;
      }
    }
    if (currentValues.value[column.name] && column.validation) {
      const error = applyRegexValidation(currentValues.value[column.name], column.validation);
      if (error) {
        return error;
      }
    }

    return null;
  });
  return val.value;
};


const setCurrentValue = (key, value) => {
  const col = props.resource.columns.find((column) => column.name === key);
  if (['integer', 'float'].includes(col.type) && (value || value === 0)) {
    currentValues.value[key] = +value;
  } else {
    currentValues.value[key] = value;
  }
  if (['text', 'richtext', 'string'].includes(col.type) && col.enforceLowerCase) {
    currentValues.value[key] = currentValues.value[key].toLowerCase();
  }

  currentValues.value = { ...currentValues.value };
  emit('update:record', currentValues.value);
};

onMounted(() => {
  currentValues.value = Object.assign({}, props.record);
  initFlowbite();
  emit('update:isValid', isValid.value);
});

const columnOptions = computedAsync(async () => { 
  return (await Promise.all(
    Object.values(props.resource.columns).map(async (column) => {
      if (column.foreignResource) {
        const list = await callAdminForthApi({
          method: 'POST',
          path: `/get_resource_foreign_data`,
          body: {
            resourceId: router.currentRoute.value.params.resourceId,
            column: column.name,
            limit: 1000,
            offset: 0,
          },
        });
        return { [column.name]: list.items };
      }
    })
  )).reduce((acc, val) => Object.assign(acc, val), {})

}, {});


const editableColumns = computed(() => {
  const mode = props.record ? 'edit' : 'create';
  return props.resource?.columns?.filter(column => column.showIn.includes(mode));
});

const isValid = computed(() => {
  return editableColumns.value?.every(column => !columnError(column));
});

watch(() => isValid.value, (value) => {
  emit('update:isValid', value);
});

</script>
