<template>
  <div class="rounded-default">
    
    <div 
      class="relative shadow-resourseFormShadow sm:rounded-lg dark:shadow-2xl dark:shadow-black rounded-default"
    >
      <form autocomplete="off" @submit.prevent>
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 ">
          <thead class="text-xs text-gray-700 uppercase bg-lightormHeading dark:bg-gray-700 dark:text-gray-400">
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
                  class="bg-ligftForm dark:bg-gray-800 border-b dark:border-gray-700"
              >
                <!-- if column is in customComponentsPerColumn, use this component. If not, use this code -->
                <template v-if="column?.components?.[props.source].file">
                    <component
                        :is="getCustomComponent(column.components[props.source])"
                        :column="column"
                        :value="currentValues[column.name]"
                        @update:value="setCurrentValue(column.name, $event)"
                        :meta="column.components[props.source].meta"
                    />
                </template>
                <template v-else>
                    <td class="px-6 py-4 whitespace-nowrap "> <!--align-top-->
                      {{ column.label }}
                      <span :data-tooltip-target="`tooltip-show-${i}`" class="relative inline-block">
                          <IconExclamationCircleSolid v-if="column.required[mode]" class="w-4 h-4" 
                          :class="(columnError(column) && validating) ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'"
                          />
                      </span>
                      <div :id="`tooltip-show-${i}`"
                          role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                          Required field
                          <div class="tooltip-arrow" data-popper-arrow></div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap relative">
                    <Dropdown
                        single
                        v-if="column.foreignResource"
                        :options="columnOptions[column.name] || []"
                        :placeholder = "columnOptions[column.name]?.length || 'There are no options available'"
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
                        v-else-if="['text'].includes(column.type)"
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
                    <div v-if="columnError(column) && validating" class="mt-1 text-xs text-red-500 dark:text-red-400">{{ columnError(column) }}</div>

                    <div v-if="column.editingNote && column.editingNote[mode]" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ column.editingNote[mode] }}</div>
                    </td>
                </template>
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
import { useCoreStore } from '@/stores/core';
import { callAdminForthApi, getCustomComponent } from '@/utils';
import { IconExclamationCircleSolid, IconEyeSlashSolid, IconEyeSolid } from '@iconify-prerendered/vue-flowbite';
import { computedAsync } from '@vueuse/core';
import { initFlowbite } from 'flowbite';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  loading: Boolean,
  resource: Object,
  record: Object,
  validating: Boolean,
  source: String,
});

const unmasked = ref({});

const mode = computed(() => props.record  && Object.keys(props.record).length ? 'edit' : 'create');

const emit = defineEmits(['update:record', 'update:isValid']);

const currentValues = ref({});


const columnError = (column) => {
  const val = computed(() => {
    if ( column.required[mode.value] && (currentValues.value[column.name] === undefined || currentValues.value[column.name] === null || currentValues.value[column.name] === '') ) {
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
    if ( column.validation && column.validation.length ){
      const validationArray = column.validation;
      for (let i = 0; i < validationArray.length; i++) {
        if (validationArray[i].regExp) {
          const regExp = new RegExp(validationArray[i].regExp);
          let value = currentValues.value[column.name];
          if (value === undefined || value === null) {
            value = '';
          }
          if (!regExp.test(value)) {
            return validationArray[i].message;
          }
        }
      }

    }
    return null;
  });
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

const coreStore = useCoreStore();

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
