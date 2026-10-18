<template>
    <!-- tag form used to reset the input (method .reset() in clear() function) -->
  <form class="flex items-center justify-center w-full"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="dragging = false; doEmit(($event.dataTransfer as DataTransfer).files)"
  >
      <label :id="id" class="flex flex-col items-center justify-center w-full border border-dashed rounded-lg cursor-pointer transition-colors
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
          <span v-if="!selectedFiles.length" class="flex items-center justify-center w-9 h-9 mb-3 rounded-lg border border-lightDropzoneBorder bg-lightDropzoneBackgroundHover text-lightDropzoneIcon dark:border-darkDropzoneBorder dark:bg-darkDropzoneBackgroundHover dark:text-darkDropzoneIcon">
            <IconCloudUpload class="w-5 h-5" />
          </span>

          <div
            v-else
            class="flex items-center justify-center py-1 flex-wrap gap-2 w-full mt-1 mb-4 px-4"
          >
            <template v-for="(file, index) in selectedFiles" :key="index">
              <div
                class="text-sm text-lightDropzoneIcon dark:text-darkDropzoneIcon  bg-lightDropzoneBackgroundHover dark:bg-darkDropzoneBackgroundHover rounded-default 
                      flex items-center gap-1 px-2 py-1 group"
              >
                <IconFile class="w-4 h-4 flex-shrink-0" />
                <span
                  class="truncate max-w-[200px]"
                  :title="file.name"
                >
                  {{ shortenFileName(file.name) }}
                </span>
                <span class="text-xs">({{ humanifySize(file.size) }})</span>
                <button
                  type="button"
                  @click.prevent.stop="removeFile(index)"
                  class="text-lightDropzoneIcon dark:text-darkDropzoneIcon hover:text-lightInputErrorColor dark:hover:text-darkInputErrorColor 
                        opacity-70 hover:opacity-100 transition-all"
                  :title="$t('Remove file')"
                >
                  <IconX class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>
          </div>

          <p
            v-if="!selectedFiles.length"
            class="mb-2 text-sm text-lightDropzoneText dark:text-darkDropzoneText"
          >
            <span class="font-medium text-lightPrimary dark:text-darkPrimary">{{ $t('Click to upload') }}</span>
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
import { humanifySize } from './fileSize';
import { ref, type Ref, computed } from 'vue';
import { IconFile, IconX, IconCloudUpload } from '@iconify-prerendered/vue-lucide';
import { watch } from 'vue';
import { useAdminforth } from '@/adminforth';

const { alert } = useAdminforth();

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

function shortenFileName(name: string, maxLength = 24) {
  if (name.length <= maxLength) return name;

  const lastDotIndex = name.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < name.length - 1;
  const extension = hasExtension ? name.slice(lastDotIndex + 1) : '';
  const baseName = hasExtension ? name.slice(0, lastDotIndex) : name;

  const startName = baseName.slice(0, 12);
  const endName = baseName.split('').reverse().slice(0, 4).reverse().join('');
  return hasExtension ? `${startName}...${endName}.${extension}` : `${startName}...${endName}`;
}

watch(() => props.modelValue, (files) => {
  if (files && files.length > 0) {
    selectedFiles.value = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      mime: file.type,
    }));
    storedFiles.value = Array.from(files);
  } else {
    selectedFiles.value = [];
    storedFiles.value = [];
  }
}, { immediate: true });

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
      alert({
        message: `The file "${file.name}" is already selected.`,
        variant: 'warning',
      });
      return;
    }

    if (!allowedExtensions.includes(`.${extension}`)) {
      alert({
        message: `Sorry, the file type .${extension} is not allowed. Please upload a file with one of the following extensions: ${allowedExtensions.join(', ')}`,
        variant: 'danger',
      });
      return;
    }
    if (size > maxSizeBytes) {
      alert({
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