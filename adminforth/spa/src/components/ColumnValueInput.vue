<template>
  <div class="flex" :class="{ 'opacity-50' : column.editReadonly && source === 'edit' }">
    <component
      v-if="column?.components?.[props.source]?.file"
      :is="getCustomComponent(column.components[props.source])"
      :column="column"
      :value="value"
      @update:value="$emit('update:modelValue', $event)"
      :meta="column.components[props.source].meta"
      :record="currentValues"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      @update:inValidity="$emit('update:inValidity', $event)"
      @update:emptiness="$emit('update:emptiness', $event)"
    />
    <Select
      v-else-if="column.foreignResource"
      ref="input"
      class="w-full min-w-24"
      :options="columnOptions[column.name] || []"
      teleportToBody
      :placeholder = "columnOptions[column.name]?.length ?$t('Select...'): $t('There are no options available')"
      :modelValue="value"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <Select
      v-else-if="column.enum"
      ref="input"
      class="w-full min-w-24"
      :options="column.enum"
      teleportToBody
      :modelValue="value"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <Select
      v-else-if="(type || column.type) === 'boolean'"
      ref="input"
      class="w-full min-w-24"
      :options="getBooleanOptions(column)"
      teleportToBody
      :modelValue="value"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <Input
      v-else-if="['integer'].includes(type || column.type)"
      ref="input"
      type="number"
      step="1"
      class="w-40"
      placeholder="0"
      :min="![undefined, null].includes(column.minValue) ? column.minValue : ''"
      :max="![undefined, null].includes(column.maxValue) ? column.maxValue : ''"
      :prefix="column.inputPrefix"
      :suffix="column.inputSuffix"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      :modelValue="value"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <CustomDatePicker
      v-else-if="['datetime', 'date', 'time'].includes(type || column.type)"
      ref="input"
      :column="column"
      :valueStart="value"
      auto-hide
      @update:valueStart="$emit('update:modelValue', $event)"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
    />
    <Input
      v-else-if="['decimal', 'float'].includes(type || column.type)"
      ref="input"
      type="number"
      step="0.1"
      class="w-40"
      placeholder="0.0"
      :min="![undefined, null].includes(column.minValue) ? column.minValue : ''"
      :max="![undefined, null].includes(column.maxValue) ? column.maxValue : ''"
      :prefix="column.inputPrefix"
      :suffix="column.inputSuffix"
      :modelValue="value"
      @update:modelValue="$emit('update:modelValue', $event)"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
    />
    <textarea
      v-else-if="['text', 'richtext'].includes(type || column.type)"
      ref="input"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
      :placeholder="$t('Text')"
      :value="value"
      @input="$emit('update:modelValue', $event.target.value)"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
    />
    <textarea
      v-else-if="['json'].includes(type || column.type)"
      ref="input"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
      :placeholder="$t('Text')"
      :value="value"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <Input
      v-else
      ref="input"
      :type="!column.masked || unmasked[column.name] ? 'text' : 'password'"
      class="w-full"
      :placeholder="$t('Text')"
      :prefix="column.inputPrefix"
      :suffix="column.inputSuffix"
      :modelValue="value"
      @update:modelValue="$emit('update:modelValue', $event)"
      autocomplete="false"
      data-lpignore="true"
      :readonly="(column.editReadonly && source === 'edit') || readonly"
      @focus="onFocusHandler($event, column, source)"
    />

    <button
      v-if="deletable"
      type="button"
      class="h-6 inset-y-2 right-0 flex items-center px-2 pt-4 z-index-100 focus:outline-none"
      @click="$emit('delete')"
    >
      <IconTrashBinSolid class="w-6 h-6 text-gray-400"/>
    </button>
    <button
      v-else-if="column.masked"
      type="button"
      @click="$emit('update:unmasked')"
      class="h-6 inset-y-2 right-0 flex items-center px-2 pt-4 z-index-100 focus:outline-none"
    >
      <IconEyeSolid class="w-6 h-6 text-gray-400"  v-if="!unmasked[column.name]"/>
      <IconEyeSlashSolid class="w-6 h-6 text-gray-400" v-else />
    </button>
  </div>
</template>

<script setup lang="ts">
  import { IconEyeSlashSolid, IconEyeSolid, IconTrashBinSolid } from '@iconify-prerendered/vue-flowbite';
  import CustomDatePicker from "@/components/CustomDatePicker.vue";
  import Select from '@/afcl/Select.vue';
  import Input from '@/afcl/Input.vue';
  import { ref } from 'vue';
  import { getCustomComponent } from '@/utils';
  import { useI18n } from 'vue-i18n';
  import { useCoreStore } from '@/stores/core';

  const coreStore = useCoreStore();

  const { t } = useI18n();

  const props = withDefaults(
    defineProps<{
      source: 'create' | 'edit',
      column: any,
      type?: string,
      value: any,
      currentValues: any,
      mode: string,
      columnOptions: any,
      unmasked: any,
      deletable?: boolean,
      readonly?: boolean,
    }>(),
    {
      type: undefined,
      deletable: false,
      readonly: false,
    }
  );

  const input = ref(null);

  const getBooleanOptions = (column: any) => {
    const options: Array<{ label: string; value: boolean | null }> = [
      { label: t('Yes'), value: true },
      { label: t('No'), value: false },
    ];
    if (!column.required[props.mode] && !column.isArray?.enabled) {
      options.push({ label: t('Unset'), value: null });
    }
    return options;
  };

  function onFocusHandler(event:FocusEvent, column:any, source:string, ) {
    const focusedInput = event.target as HTMLInputElement; 
    if(!focusedInput) return;  
    if (column.editReadonly && source === 'edit') return;  
    else {
      focusedInput.removeAttribute('readonly'); 
    }
  }

  function focus() {
    if (input.value?.focus) input.value?.focus();
  }

  defineExpose({
    focus,
  });
</script>