<template>
  <div class="rounded-lg shadow-resourseFormShadow dark:shadow-darkResourseFormShadow dark:shadow-2xl">
    <div v-if="group.groupName && !group.noTitle" class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-gray-600 text-gray-700 bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead v-if="!allColumnsHaveCustomComponent" class="text-xs text-gray-700 uppercase dark:text-gray-400 bg-lightFormHeading dark:bg-gray-700 block md:table-row-group ">
        <tr>
          <th scope="col" :class="{'rounded-tl-lg': !group.groupName}" class="px-6 py-3 hidden md:w-52 md:table-cell">
              {{ $t('Field') }}
          </th>
          <th scope="col" :class="{'rounded-tr-lg': !group.groupName}" class="px-6 py-3 hidden md:table-cell">
              {{ $t('Value') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(column, i) in group.columns"
          :key="column.name"
          v-if="currentValues !== null"
          class="bg-ligftForm dark:bg-gray-800 dark:border-gray-700 block md:table-row"
          :class="{ 'border-b': i !== group.columns.length - 1}"
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
                  {{ $t('Required field') }}
                </template>
              </Tooltip>
            </span>
          </td>
          <td
            class="px-6 py-4  whitespace-pre-wrap relative block md:table-cell"
            :class="{'rounded-br-lg': i === group.columns.length - 1}"
          >
            <ColumnValueInputWrapper
              :source="source"
              :column="column"
              :currentValues="currentValues"
              :mode="mode"
              :columnOptions="columnOptions"
              :unmasked="unmasked"
              :setCurrentValue="setCurrentValue"
              @update:unmasked="unmasked[$event] = !unmasked[$event]"
              @update:inValidity="customComponentsInValidity[$event.name] = $event.value"
              @update:emptiness="customComponentsEmptiness[$event.name] = $event.value"
              :readonly="readonlyColumns?.includes(column.name)"
            />
            <div v-if="columnError(column) && validating" class="mt-1 text-xs text-red-500 dark:text-red-400">{{ columnError(column) }}</div>
            <div v-if="column.editingNote && column.editingNote[mode]" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ column.editingNote[mode] }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { IconExclamationCircleSolid, IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
  import { Tooltip } from '@/afcl';
  import { ref, computed, watch, nextTick, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ColumnValueInputWrapper from "@/components/ColumnValueInputWrapper.vue";

  const { t } = useI18n();

  const props = defineProps<{
    source: 'create' | 'edit',
    group: any,
    mode: string,
    validating: boolean,
    currentValues: any,
    unmasked: any,
    columnError: (column: any) => string,
    setCurrentValue: (columnName: string, value: any) => void,
    columnOptions: any,
    readonlyColumns?: string[],
  }>();

  const customComponentsInValidity: Ref<Record<string, boolean>> = ref({});
  const customComponentsEmptiness: Ref<Record<string, boolean>> = ref({});
  const allColumnsHaveCustomComponent = computed(() => {
    return props.group.columns.every(column => {
      const componentKey = `${props.source}Row` as keyof typeof column.components;
      return column.components?.[componentKey];
    });
  });

  const emit = defineEmits(['update:customComponentsInValidity', 'update:customComponentsEmptiness']);

  watch(customComponentsInValidity.value, (newVal) => {
    emit('update:customComponentsInValidity', newVal);
  });

  watch(customComponentsEmptiness.value, (newVal) => {
    emit('update:customComponentsEmptiness', newVal);
  });

</script>