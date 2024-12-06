<template>

  <SuggestionInput 
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 
      focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
      dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 whitespace-normal"
      v-model="currentValue"
      :type="column.type"
      :completionRequest="complete"
      :debounceTime="meta.debounceTime"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, Ref  } from 'vue';
import { callAdminForthApi } from '@/utils';
import { AdminForthColumnCommon } from '@/types/Common';
import SuggestionInput from 'vue-suggestion-input';
import 'vue-suggestion-input/dist/style.css';


const props = defineProps<{
  column: AdminForthColumnCommon,
  record: any,
  meta: any,
}>();

const emit = defineEmits([
  'update:value',
]);

const currentValue: Ref<string> = ref('');

onMounted(() => {
  currentValue.value = props.record[props.column.name] || '';
});

watch(() => currentValue.value, (value) => {
  emit('update:value', value);
});

watch(() => props.record, (value) => {
  currentValue.value = value[props.column.name] || '';
});

async function complete(textBeforeCursor: string) {
  const res = await callAdminForthApi({
      path: `/plugin/${props.meta.pluginInstanceId}/doComplete`,
      method: 'POST',
      body: {
        record: {...props.record, [props.column.name]: textBeforeCursor},
      },
  });

  return res.completion;
}

</script>

