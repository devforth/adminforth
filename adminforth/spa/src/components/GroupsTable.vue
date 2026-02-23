<template>
  <div class="rounded-lg shadow-resourseFormShadow dark:shadow-darkResourseFormShadow dark:shadow-2xl">
    <div v-if="group.groupName && !group.noTitle" class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-darkFormBorder text-lightListTableHeadingText bg-lightFormHeading dark:bg-darkFormHeading dark:text-darkListTableHeadingText rounded-t-lg">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-lightFormFieldTextColor dark:text-darkFormFieldTextColor">
      <thead v-if="!allColumnsHaveCustomComponent" class="text-xs text-lightListTableHeadingText uppercase dark:text-darkListTableHeadingText bg-lightFormHeading dark:bg-darkFormHeading block md:table-row-group ">
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
          class="bg-lightForm dark:bg-darkForm dark:border-darkFormBorder block md:table-row"
          :class="{ 'border-b': i !== group.columns.length - 1}"
        >
          <td class="px-6 py-4 flex items-center block pb-0 md:pb-4 relative md:table-cell" 
              :class="{'rounded-bl-lg border-b-none': i === group.columns.length - 1}"> <!--align-top-->
            <div class="absolute inset-0 flex items-center overflow-hidden px-6 py-4 max-h-32">
              <span class="flex items-center gap-1">                     
                {{ column.label }}
                <Tooltip v-if="column.required[mode]">

                  <IconExclamationCircleSolid v-if="column.required[mode]" class="w-4 h-4" 
                    :class="(columnError(column) && validating) ? 'text-lightInputErrorColor dark:text-darkInputErrorColor' : 'text-lightRequiredIconColor dark:text-darkRequiredIconColor'"
                  />

                  <template #tooltip>
                    {{ $t('Required field') }}
                  </template>
                </Tooltip>
              </span>
            </div>
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
            <div v-if="columnError(column) && validating" class="af-invalid-field-message mt-1 text-xs text-lightInputErrorColor dark:text-darkInputErrorColor">{{ columnError(column) }}</div>
            <div v-if="column.editingNote && column.editingNote[mode]" class="mt-1 text-xs text-lightFormFieldTextColor dark:text-darkFormFieldTextColor">{{ column.editingNote[mode] }}</div>
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
  import type { AdminForthResourceColumnInputCommon } from '@/types/Common';

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
    return props.group.columns.every((column: AdminForthResourceColumnInputCommon) => {
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