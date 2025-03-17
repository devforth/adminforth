<template>
  <div>
    <ColumnValueInput
      v-for="(arrayItemValue, arrayItemIndex) in value"
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
      @update:modelValue="updateArrayItem($event, arrayItemIndex)"
      @update:unmasked="$emit('update:unmasked', !unmasked)"
      @update:inValidity="$emit('update:inValidity', $event)"
      @update:emptiness="$emit('update:emptiness', $event)"
      @delete="deleteArrayItem(arrayItemIndex)"
    />
    <button
      v-if="!column.editReadonly"
      type="button"
      @click="addArrayItem"
      class="flex items-center py-1 px-3 me-2 text-sm font-medium rounded-default text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      :class="{'mt-2': value.length}"
    >
      <IconPlusOutline class="w-4 h-4 me-2"/>
      {{ $t('Add') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
import ColumnValueInput from "./ColumnValueInput.vue";
import { ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  source: 'create' | 'edit',
  column: any,
  value: any[],
  currentValues: any,
  mode: string,
  columnOptions: any,
  unmasked: any
}>();

const emit = defineEmits([
  'update:modelValue',
  'update:unmasked',
  'update:inValidity',
  'update:emptiness'
]);

const arrayItemRefs = ref([]);

function updateArrayItem(newValue: any, index: number) {
  const newArray = [...props.value];
  newArray[index] = newValue;
  emit('update:modelValue', newArray);
}

function deleteArrayItem(index: number) {
  const newArray = props.value.filter((_, i) => i !== index);
  emit('update:modelValue', newArray);
}

async function addArrayItem() {
  const newArray = [...props.value, null];
  emit('update:modelValue', newArray);
  await nextTick();
  arrayItemRefs.value[arrayItemRefs.value.length - 1].focus();
}
</script>
