<template>
  <div v-if="line" class="flex">
    <span class="w-4 shrink-0"></span>
    <span :class="TEXT_CLASSES" :style="indent"><span v-for="(token, i) in line" :key="i" :class="JSON_TOKEN_CLASSES[token.kind]">{{ token.text }}</span></span>
  </div>
  <div v-else>
    <div class="flex">
      <button
        type="button"
        class="afcl-json-viewer-toggle flex items-center justify-center w-4 h-5 shrink-0 rounded text-lightInputPlaceholderText hover:text-lightInputIconColor hover:bg-lightSecondaryDarken dark:text-darkInputPlaceholderText dark:hover:text-darkInputIconColor dark:hover:bg-darkSecondaryLighten focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing"
        :aria-expanded="!folded"
        :aria-label="folded ? t('Expand') : t('Collapse')"
        @click="folded = !folded"
      >
        <IconChevronRight class="w-3 h-3 transition-transform motion-reduce:transition-none" :class="{ 'rotate-90': !folded }" />
      </button>
      <!-- a folded node keeps one line: the preview gets the width which the key and the size leave -->
      <span class="flex items-center min-w-0 flex-1 whitespace-pre" :style="indent">
        <span v-for="(token, i) in keyTokens" :key="i" class="shrink-0" :class="JSON_TOKEN_CLASSES[token.kind]">{{ token.text }}</span>
        <template v-if="folded">
          <button
            type="button"
            class="afcl-json-viewer-preview min-w-0 max-w-[52ch] truncate rounded text-left hover:bg-lightSecondaryDarken dark:hover:bg-darkSecondaryLighten focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing"
            @click="folded = false"
          ><span v-for="(token, i) in preview" :key="i" :class="JSON_TOKEN_CLASSES[token.kind]">{{ token.text }}</span></button>
          <span v-if="!last" :class="JSON_TOKEN_CLASSES.punct">,</span>
          <span class="ml-1.5" :class="JSON_SIZE_CLASSES">{{ sizeLabel }}</span>
        </template>
        <span v-else :class="JSON_TOKEN_CLASSES.punct">{{ brackets[0] }}</span>
      </span>
    </div>
    <template v-if="!folded">
      <JsonViewerNode
        v-for="([key, item], i) in entries"
        :key="i"
        :value="item"
        :keyName="key"
        :depth="depth + 1"
        :last="i === entries.length - 1"
        :expandDepth="expandDepth"
        :lineWidth="lineWidth"
      />
      <div class="flex">
        <span class="w-4 shrink-0"></span>
        <span :class="TEXT_CLASSES" :style="indent"><span :class="JSON_TOKEN_CLASSES.punct">{{ brackets[1] }}{{ last ? '' : ',' }}</span></span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconChevronRight } from '@iconify-prerendered/vue-lucide';
import {
  JSON_PREVIEW_DEPTH,
  JSON_PREVIEW_LENGTH,
  JSON_SIZE_CLASSES,
  JSON_TOKEN_CLASSES,
  inlineJsonTokens,
  isJsonContainer,
  jsonBrackets,
  jsonEntries,
  jsonKeyTokens,
  jsonSizeLabel,
  jsonTokensLength,
  type JsonToken,
} from './jsonFormat';

const TEXT_CLASSES = 'min-w-0 flex-1 whitespace-pre-wrap break-words';

const props = defineProps<{
  value: unknown,
  keyName?: string,
  depth: number,
  last: boolean,
  expandDepth: number,
  // characters which fit in a line of the viewer
  lineWidth: number,
}>();

const { t } = useI18n();

const indent = computed(() => ({ paddingLeft: `${props.depth * 2}ch` }));
const keyTokens = computed(() => jsonKeyTokens(props.keyName));

// the node in one line when it fits the width, otherwise null and the node breaks by keys
const line = computed<JsonToken[] | null>(() => {
  const comma: JsonToken[] = props.last ? [] : [{ kind: 'punct', text: ',' }];
  const tokens = [...keyTokens.value, ...inlineJsonTokens(props.value, Infinity, props.lineWidth), ...comma];
  const fits = !isJsonContainer(props.value) || jsonTokensLength(tokens) + props.depth * 2 <= props.lineWidth;
  return fits ? tokens : null;
});

const container = computed(() => props.value as object);
const entries = computed(() => jsonEntries(container.value));
const brackets = computed(() => jsonBrackets(container.value));
const preview = computed(() => inlineJsonTokens(props.value, JSON_PREVIEW_DEPTH, JSON_PREVIEW_LENGTH));
const sizeLabel = computed(() => jsonSizeLabel(t, container.value));

const folded = ref(props.depth >= props.expandDepth);
</script>
