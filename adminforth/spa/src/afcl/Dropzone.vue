<template>
    <!-- tag form used to reset the input (method .reset() in clear() function) -->
  <form class="flex items-center justify-center w-full"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="dragging = false; doEmit(($event.dataTransfer as DataTransfer).files)"
  >
      <label :id="id" class="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer
        hover:bg-lightDropzoneBackgroundHover hover:border-lightDropzoneBorderHover  dark:hover:border-darkDropzoneBorderHover dark:hover:bg-darkDropzoneBackgroundHover"
        :class="{
          'border-lightDropzoneBorderDragging dark:border-darkDropzoneBorderDragging': dragging,
          'border-lightDropzoneBorder dark:border-darkDropzoneBorder': !dragging,
          'bg-lightDropzoneBackgroundDragging dark:bg-darkDropzoneBackgroundDragging': dragging,
          'bg-lightDropzoneBackground dark:bg-darkDropzoneBackground': !dragging,
          'min-h-32 h-full': props.multiple,
          'h-32': !props.multiple,
        }"
      >
        <input
          :id="id"
          type="file"
          class="hidden"
          :accept="normalizedExtensions.join(',')"
          @change="$event.target && doEmit(($event.target as HTMLInputElement).files!)"
          :multiple="props.multiple || false"
        />

        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            v-if="!selectedFiles.length"
            class="w-8 h-8 mb-4 text-lightDropzoneIcon dark:text-darkDropzoneIcon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 
                5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 
                0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>

          <div
            v-else
            class="flex items-center justify-center  py-1 flex-wrap gap-2 w-full gap-2 mt-1 mb-4 px-4"
          >
            <template v-for="(file, index) in selectedFiles" :key="index">
              <div
                class="text-sm text-lightDropzoneIcon dark:text-darkDropzoneIcon  bg-lightDropzoneBackgroundHover dark:bg-darkDropzoneBackgroundHover rounded-md 
                      flex items-center gap-1 px-2 py-1 group"
              >
                <IconFileSolid class="w-4 h-4 flex-shrink-0" />
                <span class="truncate max-w-[200px]">{{ file.name }}</span>
                <span class="text-xs">({{ humanifySize(file.size) }})</span>
                <button
                  type="button"
                  @click.prevent.stop="removeFile(index)"
                  class="text-lightDropzoneIcon dark:text-darkDropzoneIcon hover:text-red-600 dark:hover:text-red-400 
                        opacity-70 hover:opacity-100 transition-all"
                  :title="$t('Remove file')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </template>
          </div>

          <p
            v-if="!selectedFiles.length"
            class="mb-2 text-sm text-lightDropzoneText dark:text-darkDropzoneText"
          >
            <span class="font-semibold">{{ $t('Click to upload') }}</span>
            {{ $t('or drag and drop') }}
          </p>

          <p class="text-xs text-lightDropzoneText dark:text-darkDropzoneText">
            {{ normalizedExtensions.join(', ').toUpperCase().replace(/\./g, '') }}
            <template v-if="props.maxSizeBytes">
              (Max size: {{ humanifySize(props.maxSizeBytes) }})
            </template>
          </p>
        </div>
      </label>
    </form>
</template>

<script setup lang="ts">
import { humanifySize } from '@/utils';
import { ref, type Ref, computed } from 'vue';
import { IconFileSolid } from '@iconify-prerendered/vue-flowbite';
import { watch } from 'vue';
import adminforth from '@/adminforth';

const props = defineProps<{
  extensions: string[],
  maxSizeBytes: number,
  multiple: boolean,
  modelValue: FileList,
}>();

const emit = defineEmits(['update:modelValue']);

const id = `afcl-dropzone-${Math.random().toString(36).substring(7)}`;

const normalizedExtensions = computed(() => {
  return props.extensions.map(ext => {
    const trimmed = ext.trim().toLowerCase();
    return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
  });
});

const selectedFiles: Ref<{
  name: string,
  size: number,
  mime: string,
}[]> = ref([]);

const storedFiles: Ref<File[]> = ref([]);

watch(() => props.modelValue, (files) => {
  if (files && files.length > 0) {
    selectedFiles.value = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      mime: file.type,
    }));
    storedFiles.value = Array.from(files);
  }
});

function doEmit(filesIn: FileList) {
  
  const multiple = props.multiple || false;
  const files = Array.from(filesIn);
  const allowedExtensions = normalizedExtensions.value;
  const maxSizeBytes = props.maxSizeBytes;

  if (!files.length) return;

  const validFiles: File[] = [];

  files.forEach(file => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const size = file.size;

    const isDuplicate = storedFiles.value.some(
      existingFile => existingFile.name === file.name && existingFile.size === file.size
    );
    
    if (isDuplicate) {
      adminforth.alert({
        message: `The file "${file.name}" is already selected.`,
        variant: 'warning',
      });
      return;
    }

    if (!allowedExtensions.includes(`.${extension}`)) {
      adminforth.alert({
        message: `Sorry, the file type .${extension} is not allowed. Please upload a file with one of the following extensions: ${allowedExtensions.join(', ')}`,
        variant: 'danger',
      });
      return;
    }
    if (size > maxSizeBytes) {
      adminforth.alert({
        message: `Sorry, the file size ${humanifySize(size)} exceeds the maximum allowed size of ${humanifySize(maxSizeBytes)}.`,
        variant: 'danger',
      });
      return;
    }
    
    validFiles.push(file);
  });

  if (!multiple) {
    storedFiles.value = validFiles.slice(0, 1);
  } else {
    storedFiles.value = [...storedFiles.value, ...validFiles];
  }
  
  selectedFiles.value = storedFiles.value.map(file => ({
    name: file.name,
    size: file.size,
    mime: file.type,
  }));

  emit('update:modelValue', storedFiles.value);

}

const dragging = ref(false);

function removeFile(index: number) {
  storedFiles.value = storedFiles.value.filter((_, i) => i !== index);
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
  emit('update:modelValue', storedFiles.value);
}

function clear() {
  selectedFiles.value = [];
  storedFiles.value = [];
  emit('update:modelValue', []);
  const form = document.getElementById(id)?.closest('form');
  form?.reset();
}

defineExpose({
    clear,
});
</script>