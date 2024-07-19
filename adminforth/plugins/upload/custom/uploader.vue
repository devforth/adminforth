<template>
  <div class="flex items-center justify-center w-full">
      <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <img v-if="imgPreview" :src="imgPreview" class="w-100 mt-4 rounded-lg h-40 object-contain" />

              <svg v-else class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>

              <template v-if="!uploaded">
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ allowedExtensionsLabel }} {{ meta.maxFileSize ? `(up to ${maxFileSizeHumanized})` : '' }}
                </p>
              </template>

              <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700 mt-1 mb-2" v-if="progress > 0 && !uploaded">
                <!-- progress bar  with smooth progress animation -->
                <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full
                  transition-all duration-200 ease-in-out
                " 
                  :style="{width: `${progress}%`}">{{ progress }}%
                </div>
              </div>

              <div v-else-if="uploaded" class="flex items-center justify-center w-full mt-1">
                <svg class="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <p class="ml-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                  File uploaded
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ humanifySize(uploadedSize) }}</span>
                </p>

                <button @click.stop.prevent="clear" class="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-500
                  hover:underline dark:hover:underline focus:outline-none">Clear</button>
              </div>
              
          </div>
          <input id="dropzone-file" type="file" class="hidden" @change="onFileChange" />
      </label>
  </div> 

</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { callAdminForthApi } from '@/utils' 

const props = defineProps({
  meta: String,
  record: Object,
})

const emit = defineEmits([
  'update:value',
  'update:inValidity',
  'update:emptiness',
]);

const imgPreview = ref(null);
const progress = ref(0);

const uploaded = ref(false);
const uploadedSize = ref(0);

watch(() => uploaded, (value) => {
  emit('update:emptiness', !value);
});

onMounted(() => {
  const previewColumnName = `previewUrl_${props.meta.pluginInstanceId}`;
  if (props.record[previewColumnName]) {
    imgPreview.value = props.record[previewColumnName];
    uploaded.value = true;
    emit('update:emptiness', false);
  }
});

const allowedExtensionsLabel = computed(() => {
  const allowedExtensions = props.meta.allowedExtensions || []
  if (allowedExtensions.length === 0) {
    return 'Any file type'
  }
  // make upper case and write in format EXT1, EXT2 or EXT3
  let label = allowedExtensions.map(ext => ext.toUpperCase()).join(', ');
  // last comma to 'or'
  label = label.replace(/,([^,]*)$/, ' or$1')
  return label
});

function clear() {
  imgPreview.value = null;
  progress.value = 0;
  uploaded.value = false;
  uploadedSize.value = 0;
  emit('update:value', null);
}

function humanifySize(size) {
  if (!size) {
    return '';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}


const onFileChange = async (e) => {
  imgPreview.value = null;
  progress.value = 0;
  uploaded.value = false;
  
  const file = e.target.files[0]

  // get filename, extension, size, mimeType
  const { name, size, type } = file;

  uploadedSize.value = size;


  const extension = name.split('.').pop();
  const nameNoExtension = name.replace(`.${extension}`, '');
  console.log('File details:', { name, extension, size, type });
  // validate file extension
  const allowedExtensions = props.meta.allowedExtensions || []
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    window.adminforth.alert({
      message: `Sorry but the file type ${extension} is not allowed. Please upload a file with one of the following extensions: ${allowedExtensionsLabel.value}`,
      variant: 'danger'
    });
    return;
  }

  // validate file size
  if (props.meta.maxFileSize && size > props.meta.maxFileSize) {
    window.adminforth.alert({
      message: `Sorry but the file size ${humanifySize(size)} is too large. Please upload a file with a maximum size of ${humanifySize(props.meta.maxFileSize)}`,
      variant: 'danger'
    });
    return;
  }

  emit('update:inValidity', 'Upload in progress...');
  try {
    // supports preview
    if (type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imgPreview.value = e.target.result;
      }
      reader.readAsDataURL(file);
    }
    
    const { uploadUrl, s3Path } = await callAdminForthApi({
        path: `/plugin/${props.meta.pluginInstanceId}/get_s3_upload_url`,
        method: 'POST',
        body: {
          originalFilename: nameNoExtension,
          contentType: type,
          size,
          originalExtension: extension,
        },
    });

    const xhr = new XMLHttpRequest();
    const success = await new Promise((resolve) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100);
        }
      };
      xhr.addEventListener('loadend', () => {
        const success = xhr.readyState === 4 && xhr.status === 200;
        // try to read response
        resolve(success);
      });
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', type);
      xhr.setRequestHeader('x-amz-tagging', (new URL(uploadUrl)).searchParams.get('x-amz-tagging'));
      xhr.send(file);
    });
    if (!success) {
      window.adminforth.alert({
        messageHtml: `<div>Sorry but the file was not be uploaded because of S3 Request Error: </div>
        <pre style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${
          xhr.responseText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }</pre>`,
        variant: 'danger',
        timeout: 30,
      });
      imgPreview.value = null;
      uploaded.value = false;
      progress.value = 0;
      return;
    }
    uploaded.value = true;
    emit('update:value', s3Path);
  } catch (error) {
    console.error('Error uploading file:', error);
    window.adminforth.alert({
      message: `Sorry but the file was not be uploaded. Please try again: ${error.message}`,
      variant: 'danger'
    });
    imgPreview.value = null;
    uploaded.value = false;
    progress.value = 0;
  } finally {
    emit('update:inValidity', false);
  }
}



</script>