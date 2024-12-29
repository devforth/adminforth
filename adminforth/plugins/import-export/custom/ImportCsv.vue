<template>
  <div @click="importCsv" class="cursor-pointer flex gap-2 items-center">
    {{$t('Import from CSV')}}

    <svg v-if="inProgress"
      aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { callAdminForthApi } from '@/utils';
import adminforth from '@/adminforth';

const inProgress: Ref<boolean> = ref(false);

const props = defineProps({
  meta: Object,
  record: Object,
});

async function postData(data: Record<string, string[]>) {
  console.log('postData 1 ', data);

  const resp = await callAdminForthApi({
    path: `/plugin/${props.meta.pluginInstanceId}/import-csv`,
    method: 'POST',
    body: {
      data
    }
  });

  inProgress.value = false;

  if (resp.importedCount > 0) {
    adminforth.list.refresh();
  }
  adminforth.alert({
    message: `Imported count ${resp.importedCount || 0} records. ${resp.errors?.length ? `Errors: ${resp.errors.join(', ')}` : ''}`,
    variant: resp.errors?.length ? (
      resp.importedCount ? 'warning' : 'danger'
    ) : 'success'
  });

  adminforth.list.closeThreeDotsDropdown();
}

async function importCsv() {
  // create file input and open it (with csv type)
  inProgress.value = false;
  const fileInput = document.createElement('input');

  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.click();
  fileInput.onchange = async (e) => {
    inProgress.value = true;

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      inProgress.value = false;
      return;
    }

    // post data in format, plain json 
    // data is in format {[columnName]: [value1, value2, value3...], [columnName2]: [value1, value2, value3...]}
    const data = {};
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result as string;

      const lines = text.split('\n');
      const columns = lines[0].split(',');
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        for (let j = 0; j < columns.length; j++) {
          if (!data[columns[j]]) {
            data[columns[j]] = [];
          }
          data[columns[j]].push(values[j]);
        }
      }
      await postData(data);
    };
    reader.readAsText(file);


    
  };

}

</script>