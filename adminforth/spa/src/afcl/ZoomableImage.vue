<template>
  <img ref="image" v-bind="restAttrs" :src="src" :alt="alt" :class="rootClasses" @click.stop="zoom.open()" />
</template>

<style>
  /* medium-zoom appends the overlay and the zoomed image to body: they have to cover the page
     and the docked agent chat (z-40); the zoomed image comes later, so it is above the overlay */
  .medium-zoom-overlay,
  .medium-zoom-image--opened {
    @apply z-50;
  }
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useAttrs, useTemplateRef } from 'vue';
import mediumZoom, { type Zoom } from 'medium-zoom';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  src: string,
  alt?: string,
}>(), {
  alt: '',
});

// a photo lightbox is dark in both themes, so the overlay is a black tint and not a theme token;
// medium-zoom sets it inline, a class could not override it
const OVERLAY_BACKGROUND = 'rgb(0 0 0 / 0.8)';
const ZOOM_MARGIN = 24;

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses(
  'afcl-zoomable-image cursor-zoom-in',
  attrs.class as ClassNameValue,
));

const image = useTemplateRef<HTMLImageElement>('image');
// medium-zoom opens an image from a click listener on document, which a parent stopping the click
// (a table row which opens the record) would never let through. The image opens itself and keeps
// the click from its parents; closing stays with medium-zoom (overlay, zoomed image, Esc, scroll).
let zoom: Zoom;

onMounted(() => {
  zoom = mediumZoom(image.value!, { margin: ZOOM_MARGIN, background: OVERLAY_BACKGROUND });
});

onBeforeUnmount(() => zoom.detach());
</script>
