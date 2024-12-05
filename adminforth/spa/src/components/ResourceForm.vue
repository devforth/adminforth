<template>
  <div class="rounded-default">
    <form autocomplete="off" @submit.prevent>
      <div v-if="!groups || groups.length === 0">
        <GroupsTable
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
        @update:customComponentsInValidity="(data) => customComponentsInValidity.value = { ...customComponentsInValidity.value, ...data }"
        @update:customComponentsEmptiness="(data) => customComponentsEmptiness.value = { ...customComponentsEmptiness.value, ...data }"
        />
      </div>
      <div v-else class="flex flex-col gap-4">
        <template v-for="group in groupedColumns" :key="group.groupName"> 
          <GroupsTable
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
          @update:customComponentsInValidity="(data) => customComponentsInValidity.value = { ...customComponentsInValidity.value, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness.value = { ...customComponentsEmptiness.value, ...data }"
          />
        </template>
        <div v-if="otherColumns.length > 0">
          <GroupsTable
          :source="source"
          :group="{groupName: 'Other', columns: otherColumns}"
          :currentValues="currentValues"
          :editableColumns="editableColumns"
          :mode="mode"
          :unmasked="unmasked"
          :columnOptions="columnOptions"
          :validating="validating"
          :columnError="columnError"
          :setCurrentValue="setCurrentValue"
          @update:customComponentsInValidity="(data) => customComponentsInValidity.value = { ...customComponentsInValidity.value, ...data }"
          @update:customComponentsEmptiness="(data) => customComponentsEmptiness.value = { ...customComponentsEmptiness.value, ...data }"
          />
        </div>
      </div>
    </form>
  </div>

</template>

<script setup>

import { applyRegexValidation, callAdminForthApi} from '@/utils';
import { computedAsync } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCoreStore } from "@/stores/core";
import GroupsTable from '@/components/GroupsTable.vue';

const coreStore = useCoreStore();

const router = useRouter();
const route = useRoute();
const props = defineProps({
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
    if (column.type === 'json' && currentValues.value[column.name]) {
      try {
        JSON.parse(currentValues.value[column.name]);
      } catch (e) {
        return 'Invalid JSON';
      }
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

  //json fields should transform to object
  const up = {...currentValues.value};
  props.resource.columns.forEach((column) => {
    if (column.type === 'json' && up[column.name]) {
      try {
        up[column.name] = JSON.parse(up[column.name]);
      } catch (e) {
        // do nothing
      }
    }
  });
  emit('update:record', up);
};

onMounted(() => {
  currentValues.value = Object.assign({}, props.record);
  // json values should transform to string
  props.resource.columns.forEach((column) => {
    if (column.type === 'json' && currentValues.value[column.name]) {
      currentValues.value[column.name] = JSON.stringify(currentValues.value[column.name], null, 2);
    }
  });
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
  return props.resource?.columns?.filter(column => column.showIn.includes(mode.value));
});

const isValid = computed(() => {
  return editableColumns.value?.every(column => !columnError(column));
});


const groups = computed(() => {
  let fieldGroupType;
  if (mode.value === 'edit' && coreStore.resource.options?.editFieldGroups !== undefined) {
    fieldGroupType = coreStore.resource.options.editFieldGroups;
  } else if (mode.value === 'create' && coreStore.resource.options?.createFieldGroups !== undefined) {
    fieldGroupType = coreStore.resource.options.createFieldGroups;
  } else {
    fieldGroupType = coreStore.resource.options?.fieldGroups;
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

watch(() => isValid.value, (value) => {
  emit('update:isValid', value);
});

</script>
