<template>
  <div class="shadow-resourseFormShadow dark:shadow-darkResourseFormShadow dark:shadow-2xl">
    <div v-if="group.groupName" class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-gray-600 text-gray-700 bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase dark:text-gray-400 bg-lightFormHeading dark:bg-gray-700 block md:table-row-group ">
        <tr>
          <th scope="col" class="px-6 py-3 hidden md:w-52 md:table-cell">
              Field
          </th>
          <th scope="col" class="px-6 py-3 hidden md:table-cell">
              Value
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(column, i) in group.columns"
          :key="column.name"
          v-if="currentValues !== null"
          class="bg-ligftForm dark:bg-gray-800 dark:border-gray-700 block md:table-row"
          :class="{ 'border-b': i !== group.columns.length - 1 }"
        >
          <td class="px-6 py-4 flex items-center block md:table-cell pb-0 md:pb-4" 
              :class="{'rounded-bl-lg border-b-none': i === group.columns.length - 1}"> <!--align-top-->
            <span class="flex items-center gap-1">                     
              {{ column.label }}
              <Tooltip v-if="column.required[mode]">

                <IconExclamationCircleSolid v-if="column.required[mode]" class="w-4 h-4" 
                  :class="(columnError(column) && validating) ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'"
                />

                <template #tooltip>
                  Required field
                </template>
              </Tooltip>
            </span>
            
            
          </td>
          <td class="px-6 py-4  whitespace-pre-wrap relative block md:table-cell rounded-br-lg " 
              :class="{'rounded-br-lg': i === group.columns.length - 1}">
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
              <Select
                class="w-full"
                v-if="column.foreignResource"
                :options="columnOptions[column.name] || []"
                :placeholder = "columnOptions[column.name]?.length ?'Select...': 'There are no options available'"
                :modelValue="currentValues[column.name]"
                @update:modelValue="setCurrentValue(column.name, $event)"
              ></Select>
              <Select
                class="w-full"
                v-else-if="column.enum"
                :options="column.enum"
                :modelValue="currentValues[column.name]"
                @update:modelValue="setCurrentValue(column.name, $event)"
              ></Select>
              <Select
                class="w-full"
                v-else-if="column.type === 'boolean'"
                :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Unset', value: null }]"
                :modelValue="currentValues[column.name]"
                @update:modelValue="setCurrentValue(column.name, $event)"
              ></Select>
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
              <textarea
                  v-else-if="['json'].includes(column.type)"
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
  </div>
</template>

<script setup>
  import { IconExclamationCircleSolid, IconEyeSlashSolid, IconEyeSolid } from '@iconify-prerendered/vue-flowbite';
  import CustomDatePicker from "@/components/CustomDatePicker.vue";
  import Select from '@/afcl/Select.vue';
  import { getCustomComponent } from '@/utils';
  import { Tooltip } from '@/afcl';


  const props = defineProps({
    source: 'create' | 'edit',
    group: Object,
    mode: String,
    validating: Boolean,
    currentValues: Object,
    unmasked: Object,
    columnError: Function,
    setCurrentValue: Function,
    columnOptions: Object
  });
</script>
