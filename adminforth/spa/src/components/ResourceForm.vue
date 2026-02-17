<template>
  <div class="rounded-default">
    <pre>
  </pre>
    <form autocomplete="off" @submit.prevent>
      <div v-if="!groups || groups.length === 0">
        <GroupsTable
        :readonlyColumns="props.readonlyColumns"
        :source="source"
        :group="{groupName: '', columns: editableColumns}"
        :currentValues="currentValues"
        :editableColumns="editableColumns"
        :mode="mode"
        :unmasked="unmasked"
        :columnOptions="columnOptions"
        :validating="validating"
        :columnError="columnError"
        :setCurrentValue="setCurrentValue"
        @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
        @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
        />
      </div>
      <div v-else class="flex flex-col gap-4">
        <template v-for="group in groupedColumns" :key="group.groupName"> 
          <GroupsTable
          :readonlyColumns="props.readonlyColumns"
          :source="source"
          :group="group"
          :currentValues="currentValues"
          :editableColumns="editableColumns"
          :mode="mode"
          :unmasked="unmasked"
          :columnOptions="columnOptions"
          :validating="validating"
          :columnError="columnError"
          :setCurrentValue="setCurrentValue"
          @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
          />
        </template>
        <div v-if="otherColumns?.length || 0 > 0">
          <GroupsTable
          :readonlyColumns="props.readonlyColumns"
          :source="source"
          :group="{groupName: $t('Other'), columns: otherColumns}"
          :currentValues="currentValues"
          :editableColumns="editableColumns"
          :mode="mode"
          :unmasked="unmasked"
          :columnOptions="columnOptions"
          :validating="validating"
          :columnError="columnError"
          :setCurrentValue="setCurrentValue"
          @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
          />
        </div>
      </div>
    </form>
  </div>

</template>

<script setup lang="ts">

import { applyRegexValidation, callAdminForthApi, loadMoreForeignOptions, searchForeignOptions, createSearchInputHandlers, checkShowIf } from '@/utils';
import { computedAsync } from '@vueuse/core';
import { computed, onMounted, reactive, ref, watch, provide, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCoreStore } from "@/stores/core";
import GroupsTable from '@/components/GroupsTable.vue';
import { useI18n } from 'vue-i18n';
import { type AdminForthResourceColumnCommon, type AdminForthResourceCommon } from '@/types/Common';

const { t } = useI18n();

const coreStore = useCoreStore();
const router = useRouter();
const route = useRoute();
const props = defineProps<{
  resource: AdminForthResourceCommon,
  record: any,
  validating: boolean,
  source: 'create' | 'edit',
  readonlyColumns?: string[],
}>();

const unmasked = ref({});

const mode = computed(() => route.name === 'resource-create' ? 'create' : 'edit');

const emit = defineEmits(['update:record', 'update:isValid']);

const currentValues = ref<any | any[] | null>(null);
const customComponentsInValidity: Ref<Record<string, AdminForthResourceColumnCommon>> = ref({});
const customComponentsEmptiness: Ref<Record<string, AdminForthResourceColumnCommon>> = ref({});

const columnOptions = ref<Record<string, any[]>>({});
const columnLoadingState = reactive<Record<string, { loading: boolean; hasMore: boolean }>>({});
const columnOffsets = reactive<Record<string, number>>({});
const columnEmptyResultsCount = reactive<Record<string, number>>({});

const columnError = (column: AdminForthResourceColumnCommon) => {
  const val = computed(() => {
    if (!currentValues.value) {
      return null;
    }
    if (customComponentsInValidity.value?.[column.name]) {
      return customComponentsInValidity.value?.[column.name];
    }
    
    if ( column.required?.[mode.value] ) {
      const naturalEmptiness = currentValues.value[column.name] === undefined ||
        currentValues.value[column.name] === null ||
        currentValues.value[column.name] === '' || 
        (column.isArray?.enabled && !currentValues.value[column.name].length);

      const emitedEmptiness = customComponentsEmptiness.value?.[column.name];
      // if component is custum it might tell other criteria for emptiness by emitting 'update:emptiness'
      // components which do not emit 'update:emptiness' will have undefined value in customComponentsEmptiness
      let actualEmptiness;
      if (emitedEmptiness !== undefined) {
        actualEmptiness = emitedEmptiness;
      } else {
        actualEmptiness = naturalEmptiness;
      }
      if (actualEmptiness) {
        return t('This field is required');
      }
    }
    if (column.type === 'json' && !column.isArray?.enabled && currentValues.value[column.name]) {
    const value = currentValues.value[column.name];              
      try {
        if (typeof value === 'object') {
          JSON.parse(JSON.stringify(value));
        } 
      } catch (e) {
        return t('Invalid JSON');
      }
    } else if (column.isArray?.enabled) {
      if (!column.isArray.allowDuplicateItems) {
        if (currentValues.value[column.name].filter((value: any, index: any, self: any) => self.indexOf(value) !== index).length > 0) {
          return t('Array cannot contain duplicate items');
        }
      }

      return currentValues.value[column.name] && currentValues.value[column.name].reduce((error: any, item: any) => {
        if (column.isArray) {
          return error || validateValue(column.isArray.itemType, item, column) ||
            (item === null || !item.toString() ? t('Array cannot contain empty items') : null);
        } else {
          return error; 
        }
      }, null);
    } else {
      if (column.type) {
        return validateValue(column.type, currentValues.value[column.name], column);
      }
    }
    
    return null;
  });
  return val.value;
};

const validateValue = (type: string, value: any, column: AdminForthResourceColumnCommon) => {
  if (type === 'string' || type === 'text') {
    if (column.maxLength && value?.length > column.maxLength) {
      return t('This field must be shorter than {maxLength} characters', { maxLength: column.maxLength });
    }
    
    if (column.minLength && value?.length < column.minLength) {
      // if column.required[mode.value] is false, then we check if the field is empty
      let needToCheckEmpty = column.required?.[mode.value] || value?.length > 0;
      if (!needToCheckEmpty) {
        return null;
      }
      return t('This field must be longer than {minLength} characters', { minLength: column.minLength });
    }
  }
  if (['integer', 'decimal', 'float'].includes(type)) {
    if (column.minValue !== undefined 
      && value !== null 
      && value < column.minValue
    ) {
      return t('This field must be greater than {minValue}', { minValue: column.minValue });
    }
    if (column.maxValue !== undefined && value > column.maxValue) {
      return t('This field must be less than {maxValue}', { maxValue: column.maxValue });
    }
  }
  if (value && column.validation) {
    const error = applyRegexValidation(value, column.validation);
    if (error) {
      return error;
    }
  }

  return null;
};


const setCurrentValue = (key: any, value: any, index = null) => {
  const col = props.resource.columns.find((column) => column.name === key);
  // if field is an array, we need to update the array or individual element
  if (((col?.type && col.type === 'json') && (col?.type && col.isArray?.enabled))) {
    if (index === null) {
      currentValues.value[key] = value;
    } else if (index === currentValues.value[key].length) {
      currentValues.value[key].push(null);
    } else {
      if (['integer', 'float'].includes(col.isArray.itemType)) {
        if (value || value === 0) {
          currentValues.value[key][index] = +value;
        } else {
          currentValues.value[key][index] = null;
        }
      } else {
        currentValues.value[key][index] = value;
      }
      if (col?.isArray && ['text', 'richtext', 'string', 'decimal'].includes(col.isArray.itemType) && col.enforceLowerCase) {
        currentValues.value[key][index] = currentValues.value[key][index].toLowerCase();
      }
    }
  } else {
    if (col?.type && ['integer', 'float'].includes(col.type)) {
      if (value || value === 0) {
        currentValues.value[key] = +value;
      } else {
        currentValues.value[key] = null;
      }
    } else {
      currentValues.value[key] = value;
    }
    if (col?.type && ['text', 'richtext', 'string', 'decimal'].includes(col?.type) && col.enforceLowerCase) {
      currentValues.value[key] = currentValues.value[key].toLowerCase();
    }
  }

  currentValues.value = { ...currentValues.value };

  // json fields should transform to object
  const up = {...currentValues.value};
  props.resource.columns.forEach((column) => {
    if (column.type === 'json' && !column.isArray?.enabled && up[column.name]) {
      try {
        up[column.name] = JSON.parse(up[column.name]);
      } catch (e) {
        // do nothing
      }
    }
  });
  emit('update:record', up);
};

watch(() => props.resource.columns, async (newColumns) => {
  if (!newColumns) return;
  
  for (const column of newColumns) {
    if (column.foreignResource) {
      if (!columnOptions.value[column.name]) {
        columnOptions.value[column.name] = [];
        columnLoadingState[column.name] = { loading: false, hasMore: true };
        columnOffsets[column.name] = 0;
        columnEmptyResultsCount[column.name] = 0;
        
        await loadMoreOptions(column.name);
      }
    }
  }
}, { immediate: true });

onMounted(() => {
  currentValues.value = Object.assign({}, props.record);
  // json values should transform to string
  props.resource.columns.forEach((column) => {
    if (column.type === 'json' && currentValues.value) {
      if (column.isArray?.enabled) {
        // if value is null or undefined, we should set it to empty array
        if (!currentValues.value[column.name]) {
          currentValues.value[column.name] = [];
        } else {
          // else copy array to prevent mutation
          if (Array.isArray(currentValues.value[column.name])) {
            currentValues.value[column.name] = [...currentValues.value[column.name]];
          } else {
            // fallback for old data
            currentValues.value[column.name] = [`${currentValues.value[column.name]}`];
          }
        }
      } else if (currentValues.value[column.name]) {
        if (typeof currentValues.value[column.name] !== 'string') {
          currentValues.value[column.name] = JSON.stringify(currentValues.value[column.name], null, 2)
          }
        }
      }
  });
  emit('update:isValid', isValid.value);
});

async function loadMoreOptions(columnName: string, searchTerm = '') {
  return loadMoreForeignOptions({
    columnName,
    searchTerm,
    columns: props.resource.columns,
    resourceId: router.currentRoute.value.params.resourceId as string,
    columnOptions,
    columnLoadingState,
    columnOffsets,
    columnEmptyResultsCount
  });
}

async function searchOptions(columnName: string, searchTerm: string) {
  return searchForeignOptions({
    columnName,
    searchTerm,
    columns: props.resource.columns,
    resourceId: router.currentRoute.value.params.resourceId as string,
    columnOptions,
    columnLoadingState,
    columnOffsets,
    columnEmptyResultsCount
  });
}


const editableColumns = computed(() => {
  return props.resource?.columns?.filter(column => column.showIn?.[mode.value] && (currentValues.value ? checkShowIf(column, currentValues.value, props.resource.columns) : true));
});

const isValid = computed(() => {
  return editableColumns.value?.every(column => !columnError(column));
});


const groups = computed(() => {
  let fieldGroupType;
  if(coreStore.resource){
    if (mode.value === 'edit' && coreStore.resource.options?.editFieldGroups !== undefined) {
      fieldGroupType = coreStore.resource.options.editFieldGroups;
    } else if (mode.value === 'create' && coreStore.resource.options?.createFieldGroups !== undefined) {
      fieldGroupType = coreStore.resource.options.createFieldGroups;
    } else {
      fieldGroupType = coreStore.resource.options?.fieldGroups;
    }
  }
  return fieldGroupType ?? [];
});

const groupedColumns = computed(() => {
  if (!groups.value || groups.value.length === 0) return [];

  return groups.value.map(group => ({
    ...group,
    columns: props.resource.columns.filter(col => group.columns.includes(col.name) && editableColumns.value.includes(col))
  }));
});

const getOtherColumns = () => {
  if (!groups.value || groups.value.length === 0) return;

  const groupedColumnNames = new Set(groupedColumns.value.flatMap(group => group.columns.map(col => col.name)));
  return editableColumns.value.filter(col => !groupedColumnNames.has(col.name));
};

const otherColumns = getOtherColumns();

const onSearchInput = computed(() => {
  return createSearchInputHandlers(
    props.resource.columns,
    searchOptions
  );
});

provide('columnLoadingState', columnLoadingState);
provide('onSearchInput', onSearchInput);
provide('loadMoreOptions', loadMoreOptions);

watch(() => isValid.value, (value) => {
  emit('update:isValid', value);
});

defineExpose({
  columnError,
  editableColumns,
})

</script>
