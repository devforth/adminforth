<template>
  <div class="rounded-lg shadow-resourseFormShadow dark:shadow-darkResourseFormShadow dark:shadow-2xl">
    <div v-if="group.groupName" class="text-md font-semibold px-6 py-3 flex flex-1 items-center dark:border-gray-600 text-gray-700 bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
      {{ group.groupName }}
    </div>
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase dark:text-gray-400 bg-lightFormHeading dark:bg-gray-700 block md:table-row-group ">
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
            <template v-if="column.isArray?.enabled">
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
                @update:unmasked="unmasked[column.name] = !unmasked[column.name]"
                @update:inValidity="customComponentsInValidity[column.name] = $event"
                @update:emptiness="customComponentsEmptiness[column.name] = $event"
                @delete="setCurrentValue(column.name, currentValues[column.name].filter((_, index) => index !== arrayItemIndex))"
              />
              <button
                v-if="!column.editReadonly"
                type="button"
                @click="setCurrentValue(column.name, currentValues[column.name], currentValues[column.name].length); focusOnLastInput(column.name)"
                class="flex items-center py-1 px-3 me-2 text-sm font-medium rounded-default text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                :class="{'mt-2': currentValues[column.name].length}"
              >
                <IconPlusOutline class="w-4 h-4 me-2"/>
                {{ $t('Add') }}
              </button>
            </template>
            <ColumnValueInput
              v-else
              :source="source"
              :column="column"
              :value="currentValues[column.name]"
              :currentValues="currentValues"
              :mode="mode"
              :columnOptions="columnOptions"
              :unmasked="unmasked"
              @update:modelValue="setCurrentValue(column.name, $event)"
              @update:unmasked="unmasked[column.name] = !unmasked[column.name]"
              @update:inValidity="customComponentsInValidity[column.name] = $event"
              @update:emptiness="customComponentsEmptiness[column.name] = $event"
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
  import ColumnValueInput from "@/components/ColumnValueInput.vue";
  import { Tooltip } from '@/afcl';
  import { ref, computed, watch, nextTick, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';

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
  }>();

  const arrayItemRefs = ref([]);

  const customComponentsInValidity: Ref<Record<string, boolean>> = ref({});
  const customComponentsEmptiness: Ref<Record<string, boolean>> = ref({});

  const emit = defineEmits(['update:customComponentsInValidity', 'update:customComponentsEmptiness']);

  async function focusOnLastInput(column) {
    // wait for element to register
    await nextTick();
    arrayItemRefs.value[arrayItemRefs.value.length - 1].focus();
  }

  watch(customComponentsInValidity.value, (newVal) => {
    emit('update:customComponentsInValidity', newVal);
  });

  watch(customComponentsEmptiness.value, (newVal) => {
    emit('update:customComponentsEmptiness', newVal);
  });

</script>
