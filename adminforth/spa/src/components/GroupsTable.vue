<template>
  <div class="rounded-lg shadow-resourseFormShadow dark:shadow-darkResourseFormShadow border border-lightFormBorder bg-lightForm dark:bg-darkForm dark:border-darkFormBorder">
    <div v-if="group.groupName && !group.noTitle" class="text-sm font-semibold px-5 py-3 flex flex-1 items-center border-b border-lightFormBorder dark:border-darkFormBorder text-lightFormFieldTextColor bg-lightFormHeading dark:bg-darkFormHeading dark:text-darkFormFieldTextColor rounded-t-lg">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-lightFormFieldTextColor dark:text-darkFormFieldTextColor">
      <thead v-if="!allColumnsHaveCustomComponent" class="text-xs font-medium text-lightListTablePaginationHelpText dark:text-darkListTablePaginationHelpText bg-lightFormHeading dark:bg-darkFormHeading block md:table-row-group border-b border-lightFormBorder dark:border-darkFormBorder">
        <tr>
          <th scope="col" :class="{'rounded-tl-lg': !group.groupName}" class="px-5 py-2.5 font-medium hidden md:w-56 md:table-cell">
              {{ $t('Field') }}
          </th>
          <th scope="col" :class="{'rounded-tr-lg': !group.groupName}" class="px-5 py-2.5 font-medium hidden md:table-cell">
              {{ $t('Value') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(column, i) in group.columns"
          :key="column.name"
          v-if="currentValues !== null"
          class="bg-lightForm dark:bg-darkForm border-lightFormBorder dark:border-darkFormBorder block md:table-row"
          :class="{ 'border-b': i !== group.columns.length - 1}"
        >
          <td class="px-5 py-3 flex items-center block pb-0 md:pb-3 relative md:table-cell" 
              :class="{'rounded-bl-lg border-b-none': i === group.columns.length - 1}"> <!--align-top-->
            <div class="absolute inset-0 flex items-center overflow-hidden px-5 py-3 max-h-32">
              <span class="flex items-center gap-1 font-medium">                     
                {{ column.label }}
                <Tooltip v-if="column.required[mode]">

                  <IconAsterisk v-if="column.required[mode]" class="w-3 h-3" 
                    :class="(columnsWithErrors[column.name] && validatingMode && !isValidating) ? 'text-lightInputErrorColor dark:text-darkInputErrorColor' : 'text-lightRequiredIconColor dark:text-darkRequiredIconColor'"
                  />

                  <template #tooltip>
                    {{ $t('Required field') }}
                  </template>
                </Tooltip>
              </span>
            </div>
          </td>
          <td
            class="px-5 py-3  whitespace-pre-wrap relative block md:table-cell"
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
              :columnsWithErrors="columnsWithErrors"
              :isValidating="isValidating"
              :validatingMode="validatingMode"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { IconAsterisk } from '@iconify-prerendered/vue-lucide';
  import { Tooltip } from '@/afcl';
  import { ref, computed, watch, nextTick, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ColumnValueInputWrapper from "@/components/ColumnValueInputWrapper.vue";
  import type { AdminForthResourceColumnInputCommon } from '@/types/Common';

  const { t } = useI18n();

  const props = defineProps<{
    source: 'create' | 'edit',
    group: any,
    mode: 'create' | 'edit',
    validatingMode: boolean,
    currentValues: any,
    unmasked: any,
    columnError: (column: any) => string,
    setCurrentValue: (columnName: string, value: any) => void,
    columnOptions: any,
    readonlyColumns?: string[],
    columnsWithErrors: Record<string, string>,
    isValidating: boolean
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