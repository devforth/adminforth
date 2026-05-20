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
        :validatingMode="validatingMode"
        :columnError="columnError"
        :setCurrentValue="setCurrentValue"
        @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
        @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
        :columnsWithErrors="columnsWithErrors"
        :isValidating="isValidating"
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
          :validatingMode="validatingMode"
          :columnError="columnError"
          :setCurrentValue="setCurrentValue"
          @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
          :columnsWithErrors="columnsWithErrors"
          :isValidating="isValidating"
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
          :validatingMode="validatingMode"
          :columnError="columnError"
          :setCurrentValue="setCurrentValue"
          @update:customComponentsInValidity="(data) => customComponentsInValidity = { ...customComponentsInValidity, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness = { ...customComponentsEmptiness, ...data }"
          :columnsWithErrors="columnsWithErrors"
          :isValidating="isValidating"
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
import { type AdminForthResourceColumnCommon, type AdminForthResourceFrontend } from '@/types/Common';
import { Mutex } from 'async-mutex';
import debounce from 'lodash.debounce';

const { t } = useI18n();

const mutex = new Mutex();

const coreStore = useCoreStore();
const router = useRouter();
const route = useRoute();
const props = defineProps<{
  resource: AdminForthResourceFrontend,
  record: any,
  validatingMode: boolean,
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
const columnsWithErrors = ref<Record<string, string>>({});
const isValidating = ref(false);
const blockSettingIsValidating = ref(false);
const isValid = ref(true);
const doesUserHaveCustomValidation = computed(() => props.resource.columns.some(column => column.validation && column.validation.some((val) => val.validator)));

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
        // add object check to allow json fields to be objects in edit mode without throwing validation error, but still validate if the string is a valid json or not
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
            (item === null || (!item || item.toString() === '') ? t('Array cannot contain empty items') : null);
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

        const currentFkValue = props.record?.[column.name];
        if (currentFkValue != null && currentFkValue !== '') {
          const inOptions = columnOptions.value[column.name]?.some((opt: any) => opt.value == currentFkValue);
          if (!inOptions) {
            const result = await callAdminForthApi({
              method: 'POST',
              path: '/get_resource_foreign_data',
              body: { resourceId: router.currentRoute.value.params.resourceId, column: column.name, limit: 1, offset: 0, currentValue: currentFkValue },
            });
            if (result?.items?.length) {
              columnOptions.value[column.name].unshift(...result.items);
            }
          }
        }
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
        if (column.showIn?.[mode.value] === false) {
          return; 
        }
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
        // Todo: reconsider basic issue
        // if value is not string, we should stringify it, but object we already stringify in setCurrentValue, so we should not stringify it again to prevent double stringification
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
    columnEmptyResultsCount,
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

function checkIfColumnHasError(column: AdminForthResourceColumnCommon) {
  const error = columnError(column);
  if (error) {
    columnsWithErrors.value[column.name] = error;
  } else {
    delete columnsWithErrors.value[column.name];
  }
}

const checkIfAnyColumnHasErrors = () => {
  return Object.keys(columnsWithErrors.value).length > 0 ? false : true;
}

const debouncedValidation = debounce(async (columns: AdminForthResourceColumnCommon[]) => {
  await mutex.runExclusive(async () => {
    await validateUsingUserValidationFunction(columns);
  });
  setIsValidatingValue(false);
  isValid.value = checkIfAnyColumnHasErrors();
}, 500);

watch(() => [editableColumns.value, props.validatingMode], async () => {
  setIsValidatingValue(true);
  
  editableColumns.value?.forEach(column => {
    checkIfColumnHasError(column);
  });

  if (props.validatingMode && doesUserHaveCustomValidation.value) {
    debouncedValidation(editableColumns.value);
  } else {
    setIsValidatingValue(false);
    isValid.value = checkIfAnyColumnHasErrors();
  }
});

const setIsValidatingValue = (value: boolean) => {
  if (!blockSettingIsValidating.value) {
    isValidating.value = value;
  }
}


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

async function validateUsingUserValidationFunction(editableColumnsInner: AdminForthResourceColumnCommon[]): Promise<void> {
  if (doesUserHaveCustomValidation.value) {
    try {
      blockSettingIsValidating.value = true;
      const res = await callAdminForthApi({
        method: 'POST',
        path: '/validate_columns',
        body: {
          resourceId: props.resource.resourceId,
          editableColumns: editableColumnsInner.map(col => {return {name: col.name, value: currentValues.value?.[col.name]} }),
          record: currentValues.value,
        }
      })
      if (res.validationResults && Object.keys(res.validationResults).length > 0) {
        for (const [columnName, validationResult] of Object.entries(res.validationResults) as [string, any][]) {
          if (!validationResult.isValid) {
            columnsWithErrors.value[columnName] = validationResult.message || 'Invalid value';
          } else {
            delete columnsWithErrors.value[columnName];
          }
        }
        const columnsToProcess = editableColumns.value.filter(col => res.validationResults[col.name] === undefined);
        columnsToProcess.forEach(column => {
          checkIfColumnHasError(column);
        });
      } else {
        editableColumnsInner.forEach(column => {
          checkIfColumnHasError(column);
        });
      }
      blockSettingIsValidating.value = false;
    } catch (e) {
      console.error('Error during custom validation', e);
      blockSettingIsValidating.value = false;
    }
  }
}

watch(customComponentsInValidity, () => {
  editableColumns.value?.forEach(column => {
    checkIfColumnHasError(column);
  });
  isValid.value = checkIfAnyColumnHasErrors();
});

defineExpose({
  columnError,
  editableColumns,
  columnsWithErrors,
  isValidating,
  validateUsingUserValidationFunction
})

</script>
