<template>
  <div class="rounded-lg shadow-resourseFormShadow dark:shadow-darkResourseFormShadow border border-lightFormBorder bg-lightForm dark:bg-darkForm dark:border-darkFormBorder">
    <div v-if="group.groupName && !group.noTitle" class="px-5 pt-4 pb-1 text-sm font-semibold text-lightFormFieldTextColor dark:text-darkFormFieldTextColor">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-lightFormFieldTextColor dark:text-darkFormFieldTextColor">
      <colgroup>
        <col class="md:w-56">
        <col>
      </colgroup>
      <tbody v-if="currentValues !== null" class="divide-y divide-lightShowTableBodyBorder dark:divide-darkShowTableBodyBorder">
        <tr
          v-for="column in group.columns"
          :key="column.name"
          class="block md:table-row"
        >
          <!-- top-aligned: the label sits on the first line of a tall value, md:pt-5 centers it on a 34px input -->
          <td class="px-5 pt-3 md:pt-5 pb-0 md:pb-3 block md:table-cell align-top">
            <span class="flex items-center gap-1 text-[13px] leading-[18px] font-medium">
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
          </td>
          <td class="px-5 pt-1.5 pb-3 md:pt-3 whitespace-pre-wrap relative block md:table-cell">
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
  import { ref, watch, nextTick, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ColumnValueInputWrapper from "@/components/ColumnValueInputWrapper.vue";

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

  const emit = defineEmits(['update:customComponentsInValidity', 'update:customComponentsEmptiness']);

  watch(customComponentsInValidity.value, (newVal) => {
    emit('update:customComponentsInValidity', newVal);
  });

  watch(customComponentsEmptiness.value, (newVal) => {
    emit('update:customComponentsEmptiness', newVal);
  });

</script>