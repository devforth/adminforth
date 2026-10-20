<template>
  <div v-if="inline" ref="rootEl" class="afcl-json-viewer afcl-json-viewer-inline inline-flex min-w-0 max-w-xs" :style="{ anchorName }">
    <button
      type="button"
      class="afcl-json-viewer-trigger inline-flex items-center gap-1.5 min-w-0 -mx-1 px-1 rounded font-mono text-xs leading-5 text-left hover:bg-lightSecondaryDarken dark:hover:bg-darkSecondaryLighten focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing"
      :aria-expanded="isOpen"
      @click.stop="isOpen = !isOpen"
    >
      <span class="truncate"><span v-for="(token, i) in preview" :key="i" :class="JSON_TOKEN_CLASSES[token.kind]">{{ token.text }}</span></span>
      <span v-if="sizeLabel" :class="JSON_SIZE_CLASSES">{{ sizeLabel }}</span>
    </button>
    <teleport :to="teleportTarget" v-if="isOpen">
      <div
        ref="popoverEl"
        popover="manual"
        role="dialog"
        :style="{ positionAnchor: anchorName }"
        class="afcl-json-viewer-popover w-[28rem] max-w-[calc(100vw-2rem)] max-h-96 overflow-auto py-2.5 pl-1.5 pr-2.5 rounded-lg bg-lightDropdownOptionsBackground shadow-popover dark:bg-darkDropdownOptionsBackground dark:shadow-darkPopover"
      >
        <JsonViewer :value="value" :expandDepth="expandDepth" />
      </div>
    </teleport>
  </div>
  <!-- the line width comes from the measured width of the viewer; inline-size containment keeps that width from depending on the
       lines, otherwise in a shrink-to-fit parent (a flex-wrap item, a cell of an auto table) every re-wrap resizes the parent and loops -->
  <div v-else ref="viewerEl" class="afcl-json-viewer group relative flex items-start gap-2 font-mono text-xs leading-5 [contain:inline-size]">
    <span ref="charEl" class="invisible absolute" aria-hidden="true">0</span>
    <div class="min-w-0">
      <JsonViewerNode :value="value" :depth="0" :last="true" :expandDepth="expandDepth" :lineWidth="lineWidth" />
    </div>
    <button
      type="button"
      class="afcl-json-viewer-copy flex items-center justify-center w-6 h-6 -mt-0.5 shrink-0 rounded-md text-lightInputIconColor hover:text-lightShowTableBodyText hover:bg-lightSecondaryDarken dark:text-darkInputIconColor dark:hover:text-darkShowTableBodyText dark:hover:bg-darkSecondaryLighten opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing"
      :aria-label="t('Copy JSON')"
      @click="copy"
    >
      <IconCheck v-if="copied" class="w-3.5 h-3.5" />
      <IconCopy v-else class="w-3.5 h-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconCheck, IconCopy } from '@iconify-prerendered/vue-lucide';
import { useElementSize } from '@vueuse/core';
import JsonViewerNode from './JsonViewerNode.vue';
import { useTeleportTarget } from './shadowRoot';
import {
  JSON_LINE_WIDTH,
  JSON_PREVIEW_DEPTH,
  JSON_PREVIEW_LENGTH,
  JSON_SIZE_CLASSES,
  JSON_TOKEN_CLASSES,
  inlineJsonTokens,
  isJsonContainer,
  jsonEntries,
  jsonSizeLabel,
} from './jsonFormat';

const OFFSET = 6;
const COPIED_MS = 1500;
// the gutter of chevrons (16px), the gap and the copy button (8px + 24px)
const CHROME_PX = 48;
const SUPPORTS_ANCHOR = CSS.supports('anchor-name: --a');

const props = withDefaults(defineProps<{
  value: unknown,
  // nodes deeper than this open folded: 0 folds the root, 1 shows the root keys with their values folded
  expandDepth?: number,
  // one line which opens the whole value in a popover, for table cells
  inline?: boolean,
}>(), {
  expandDepth: 1,
  inline: false,
});

const { t } = useI18n();
const teleportTarget = useTeleportTarget();
const anchorName = `--afcl-json-viewer-${useId()}`;

const rootEl = ref<HTMLElement>();
const popoverEl = ref<HTMLElement>();
const isOpen = ref(false);
const copied = ref(false);

const viewerEl = ref<HTMLElement>();
const charEl = ref<HTMLElement>();
const { width: viewerWidth } = useElementSize(viewerEl);

// a line holds JSON_LINE_WIDTH characters or as many as fit next to the chevrons and the copy button
const lineWidth = computed(() => viewerWidth.value
  ? Math.min(JSON_LINE_WIDTH, Math.floor((viewerWidth.value - CHROME_PX) / charEl.value!.getBoundingClientRect().width))
  : JSON_LINE_WIDTH);

const preview = computed(() => inlineJsonTokens(props.value, JSON_PREVIEW_DEPTH, JSON_PREVIEW_LENGTH));
// a single item is readable from the preview itself, so the size shows from two
const sizeLabel = computed(() => isJsonContainer(props.value) && jsonEntries(props.value).length > 1
  ? jsonSizeLabel(t, props.value)
  : null);

async function copy() {
  await navigator.clipboard.writeText(JSON.stringify(props.value, null, 2));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, COPIED_MS);
}

function onDocumentMousedown(e: MouseEvent) {
  // inside a shadow root e.target is the host, composedPath() starts at the clicked element
  const target = e.composedPath()[0] as Node;
  if (!rootEl.value!.contains(target) && !popoverEl.value!.contains(target)) {
    isOpen.value = false;
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen.value = false;
  }
}

// Safari before 26 and Firefox before 147 have no CSS anchor positioning
function placeByRect() {
  const trigger = rootEl.value!.getBoundingClientRect();
  const el = popoverEl.value!;
  const { width, height } = el.getBoundingClientRect();
  const fitsBelow = trigger.bottom + OFFSET + height <= window.innerHeight;
  el.style.top = `${fitsBelow ? trigger.bottom + OFFSET : trigger.top - OFFSET - height}px`;
  el.style.left = `${Math.min(Math.max(trigger.left, 0), window.innerWidth - width)}px`;
}

function removeListeners() {
  document.removeEventListener('mousedown', onDocumentMousedown);
  document.removeEventListener('keydown', onDocumentKeydown);
  window.removeEventListener('scroll', placeByRect, true);
  window.removeEventListener('resize', placeByRect);
}

watch(isOpen, async (opened) => {
  if (!opened) {
    removeListeners();
    return;
  }
  await nextTick();
  popoverEl.value!.showPopover();
  document.addEventListener('mousedown', onDocumentMousedown);
  document.addEventListener('keydown', onDocumentKeydown);
  if (!SUPPORTS_ANCHOR) {
    placeByRect();
    window.addEventListener('scroll', placeByRect, true);
    window.addEventListener('resize', placeByRect);
  }
});

onBeforeUnmount(removeListeners);
</script>

<style>
/* popover puts the value into the top layer, so no z-index and no clipping by overflow of the table */
.afcl-json-viewer-popover {
  inset: auto;
  margin: 0;
}

@supports (anchor-name: --a) {
  .afcl-json-viewer-popover {
    position-area: bottom span-right;
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
    margin-top: 6px;
  }
}
</style>
