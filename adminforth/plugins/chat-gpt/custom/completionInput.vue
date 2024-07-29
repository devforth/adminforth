<template>

  <SuggestionInput 
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 
      focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
      dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 whitespace-normal"

    :type="column.type"
    v-model="currentValue"
    :completionRequest="complete"
    :debounceTime="meta.debounceTime"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, Ref  } from 'vue';
import { callAdminForthApi } from '@/utils';
import { AdminForthColumn } from '@/types/AdminForthConfig';
import SuggestionInput from './suggestion-input.vue';

const props = defineProps<{
  column: AdminForthColumn,
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

async function complete() {
  console.log('complete call');
  await new Promise((resolve) => setTimeout(resolve, 400));
  // generate N random words of M length
  const numOfWords = Math.floor(Math.random() * 7) + 1;
  const words = Array.from({ length: numOfWords }, () => Math.random().toString(36).substring(2, 15));
  return words.join(' ');

  // const res = await callAdminForthApi({
  //     path: `/plugin/${props.meta.pluginInstanceId}/doComplete`,
  //     method: 'POST',
  //     body: {
  //       record: props.record
  //     },
  // });
  // console.log('resp complete  call', res);

  // return res.completion;
}

</script>

