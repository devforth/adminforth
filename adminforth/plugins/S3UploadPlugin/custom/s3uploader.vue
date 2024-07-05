<template>
  <div class="flex items-center justify-center w-full">
      <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <img v-if="imgPreview" :src="imgPreview" class="w-100 mt-4 rounded-lg h-40 object-contain" />

              <svg v-else class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ allowedExtensionsLabel }} {{ meta.maxFileSize ? `(up to ${maxFileSizeHumanized})` : '' }}
              </p>

              <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700 mt-2 mb-2" v-if="progress > 0">
                <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" 
                  :style="{width: `${progress}%`}">{{ progress }}%
                </div>
              </div>
          </div>
          <input id="dropzone-file" type="file" class="hidden" @change="onFileChange" />
      </label>
  </div> 

</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  meta: String
})

const imgPreview = ref(null);
const progress = ref(0);

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

const maxFileSizeHumanized = computed(() => {
  let maxFileSize = props.meta.maxFileSize || 0
  if (maxFileSize === 0) {
    return ''
  }
  // if maxFileSize is in bytes, convert to KB, MB, GB, TB
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (maxFileSize >= 1024 && i < units.length - 1) {
    maxFileSize /= 1024
    i++
  }
  return `${maxFileSize.toFixed(2)} ${units[i]}`
})

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) {
    imgPreview.value = null;
    progress.value = 0;
    return
  }
  console.log('File selected:', file);

  // get filename, extension, size, mimeType
  const { name, size, type } = file;


  const extension = name.split('.').pop();
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
      message: `Sorry but the file size is too large. Please upload a file with a maximum size of ${maxFileSizeHumanized.value}`,
      variant: 'danger'
    });
    return;
  }
  // supports preview
  if (type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imgPreview.value = e.target.result;
    }
    reader.readAsDataURL(file);
  }
  setInterval(() => {
    progress.value += 1;
  }, 20);

  await callAdminForthApi({
      path: `/plugin/${props.meta.pluginInstanceId}/get_s3_upload_url`,
      method: 'POST',
      body: {
        originalFilename: name,
        contentType, size, originalExtension 
      },
  });
}


</script>