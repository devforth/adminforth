<template>
  <div class="flex items-center justify-center w-full"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="dragging = false; doEmit($event.dataTransfer.files)"
  >
      <label :id="id" class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer dark:hover:bg-gray-800 
        hover:bg-gray-100  dark:hover:border-gray-500 dark:hover:bg-gray-600"
        :class="{
          'border-blue-600 dark:border-blue-400': dragging,
          'border-gray-300 dark:border-gray-600': !dragging,
          'bg-blue-50 dark:bg-blue-800': dragging,
          'bg-gray-50 dark:bg-gray-800': !dragging,
        }"
      >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
              
            
              <svg v-if="!selectedFiles.length" class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <div v-else class="flex items-center justify-center w-full mt-1 mb-4">
                <template v-for="file in selectedFiles">
                  <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <IconFileSolid class="w-5 h-5" />
                    {{ file.name }} ({{ humanifySize(file.size) }})
                  </p>
                </template>

              </div>

              <p v-if="!selectedFiles.length" class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ props.extensions.join(', ').toUpperCase().replace(/\./g, '') }}
                <template v-if="props.maxSizeBytes">
                 (Max size: {{ humanifySize(props.maxSizeBytes) }})
                </template>
              </p>
          </div>
          <input :id="id" type="file" class="hidden" 
            :accept="props.extensions.join(', ')"
            @change="doEmit($event.target.files)"
            :multiple="props.multiple || false"
          />
      </label>
  </div> 
</template>

<script setup lang="ts">
import { humanifySize } from '@/utils';
import { ref } from 'vue';
import { IconFileSolid } from '@iconify-prerendered/vue-flowbite';
import { watch } from 'vue';

const props = defineProps<{
  extensions: string[],
  maxSizeBytes: number,
  multiple: boolean,
  modelValue: FileList,
}>();

const emit = defineEmits(['update:modelValue']);

const id = `afcl-dropzone-${Math.random().toString(36).substring(7)}`;

const selectedFiles: Ref<{
  name: string,
  size: number,
  mime: string,
}[]> = ref([]);

watch(() => props.modelValue, (files) => {
  selectedFiles.value = Array.from(files).map(file => ({
    name: file.name,
    size: file.size,
    mime: file.type,
  }));
});

function doEmit(filesIn: FileList) {

  const multiple = props.multiple || false;
  const files = Array.from(filesIn);
  if (!files.length) return;
  if (!multiple) {
    files.splice(1);
  }
  selectedFiles.value = files.map(file => ({
    name: file.name,
    size: file.size,
    mime: file.type,
  }));

  emit('update:modelValue', Array.from(files));
}

const dragging = ref(false);

</script>