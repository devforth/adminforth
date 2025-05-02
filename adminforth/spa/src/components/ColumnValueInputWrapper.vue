<template>
  <template v-if="column.isArray?.enabled">
    <div class="flex flex-col">
      <ColumnValueInput
        v-for="(arrayItemValue, arrayItemIndex) in currentValues[column.name]"
        :key="`${column.name}-${arrayItemIndex}`"
        ref="arrayItemRefs"
        :class="{'mt-2': arrayItemIndex}"
        :source="source"
        :column="column"
        :type="column.isArray.itemType"
        :value="arrayItemValue"
        :currentValues="currentValues"
        :mode="mode"
        :columnOptions="columnOptions"
        :deletable="!column.editReadonly"
        @update:modelValue="setCurrentValue(column.name, $event, arrayItemIndex)"
        @update:unmasked="$emit('update:unmasked', column.name)"
        @update:inValidity="$emit('update:inValidity', { name: column.name, value: $event })"
        @update:emptiness="$emit('update:emptiness', { name: column.name, value: $event })"
        @delete="setCurrentValue(column.name, currentValues[column.name].filter((_, index) => index !== arrayItemIndex))"
      />
    </div>
    <div class="flex items-center">
      <button
        v-if="!column.editReadonly"
        type="button"
      @click="addArrayItem"
      class="flex items-center py-1 px-3 me-2 text-sm font-medium rounded-default text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      :class="{'mt-2': currentValues[column.name].length}"
    >
      <IconPlusOutline class="w-4 h-4 me-2"/>
        {{ $t('Add') }}
      </button>
    </div>
  </template>
  
  <ColumnValueInput
    v-else
    :readonly="props.readonly"
    :source="source"
    :column="column"
    :value="currentValues[column.name]"
    :currentValues="currentValues"
    :mode="mode"
    :columnOptions="columnOptions"
    :unmasked="unmasked"
    @update:modelValue="setCurrentValue(column.name, $event)"
    @update:unmasked="$emit('update:unmasked', column.name)"
    @update:inValidity="$emit('update:inValidity', { name: column.name, value: $event })"
    @update:emptiness="$emit('update:emptiness', { name: column.name, value: $event })"
  />
</template>
  
<script setup lang="ts">
  import { IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
  import ColumnValueInput from "./ColumnValueInput.vue";
  import { ref, nextTick } from 'vue';
  
  const props = defineProps<{
    source: 'create' | 'edit',
    column: any,
    currentValues: any,
    mode: string,
    columnOptions: any,
    unmasked: any,
    setCurrentValue: Function,
    readonly?: boolean,
  }>();
  
  const emit = defineEmits(['update:unmasked', 'update:inValidity', 'update:emptiness', 'focus-last-input']);
  
  const arrayItemRefs = ref([]);
  
  async function addArrayItem() {
    props.setCurrentValue(props.column.name, props.currentValues[props.column.name], props.currentValues[props.column.name].length);
    await nextTick();
    arrayItemRefs.value[arrayItemRefs.value.length - 1].focus();
  }
</script> 