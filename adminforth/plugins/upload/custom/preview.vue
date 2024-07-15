<template>
  <div>
    <img v-if="url" :src="url" class="rounded-md" 
    data-zoomable/>
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
<script setup>
import { ref, computed , onMounted, watch} from 'vue'
import mediumZoom from 'medium-zoom'


const props = defineProps({
  record: Object,
  column: Object,
  meta: Object,
})

const url = computed(() => {
  return props.record[`previewUrl_${props.meta.pluginInstanceId}`];
});


onMounted(() => {
  mediumZoom('[data-zoomable]', {
    margin: 24,
    // container: '#app',
  })
});

</script>