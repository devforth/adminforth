<template>
  <div>
    <template v-if="url">
      <img 
        v-if="contentType && contentType.startsWith('image')"
        :src="url" 
        class="rounded-md" 
        :style="maxWidth"
        ref="img"
        data-zoomable
        @click.stop="zoom.open()" 
      />
      <video 
        v-else-if="contentType && contentType.startsWith('video')"
        :src="url" 
        class="rounded-md" 
        controls
        @click.stop >
      </video>
      
      <a v-else :href="url" target="_blank"
         class="flex gap-1 items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-darkListTable dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <!-- download file icon -->
        <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        {{ $t('Download file') }}
      </a>
    </template>
    
    
  </div>
</template>

<style>
  .medium-zoom-image {
    z-index: 999999;
    background: rgba(0, 0, 0, 0.8);
  }
  .medium-zoom-overlay {
    background: rgba(255, 255, 255, 0.8) !important
  }
  body.medium-zoom--opened aside {
    filter: grayscale(1)
  } 
</style>

<style scoped>
  img {
    min-width: 150px;
  }
  video {
    min-width: 200px;
  }
</style>
<script setup>
import { ref, computed , onMounted, watch} from 'vue'
import mediumZoom from 'medium-zoom'

const img = ref(null);
const zoom = ref(null);

const props = defineProps({
  record: Object,
  column: Object,
  meta: Object,
})

const url = computed(() => {
  return props.record[`previewUrl_${props.meta.pluginInstanceId}`];
});

const maxWidth = computed(() => props.meta.maxWidth ? { maxWidth: props.meta.maxWidth } : {});


// since we have no way to know the content type of the file, we will try to guess it from extension
// for better experience probably we should check whether user saves content type in the database and use it here
const contentType = computed(() => {
  if (!url.value) {
    return null;
  }
  const u = new URL(url.value);
  return guessContentType(u.pathname);
});

function guessContentType(url) {
  if (!url) {
    return null;
  }
  const ext = url.split('.').pop();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'flv', 'wmv', 'mkv'].includes(ext)) {
    return 'video';
  }
}


onMounted(async () => {
  
  if (contentType.value?.startsWith('image')) {
    zoom.value = mediumZoom(img.value, {
      margin: 24,
    });
  }

});

</script>