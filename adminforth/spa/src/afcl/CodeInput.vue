<template>
  <div :class="rootClasses">
    <template v-for="i in length" :key="i">
      <div :class="cellClasses(i - 1)" aria-hidden="true">
        {{ code[i - 1] }}
        <span
          v-if="i - 1 === activeIndex && !code[i - 1]"
          class="afcl-code-input-caret w-px h-6 bg-lightInputText dark:bg-darkInputText animate-pulse"
        />
      </div>
      <span
        v-if="isGroupEnd(i)"
        class="afcl-code-input-separator w-3 h-0.5 shrink-0 rounded-full bg-lightInputBorder dark:bg-darkInputBorder"
        aria-hidden="true"
      />
    </template>
    <!-- one real field over the drawn cells: autofill and paste fill the whole code, screen readers read one field -->
    <input
      ref="inputRef"
      v-bind="restAttrs"
      :value="code"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      spellcheck="false"
      autocorrect="off"
      autocapitalize="off"
      :maxlength="length"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      class="afcl-code-input-field absolute inset-0 z-10 w-full h-full p-0 border-0 bg-transparent text-base text-transparent caret-transparent outline-none cursor-text selection:bg-transparent disabled:cursor-not-allowed"
      @input="setCode(($event.target as HTMLInputElement).value)"
      @paste="onPaste"
      @focus="onFocus"
      @blur="onBlur"
      @click="moveCaretToEnd"
      @select="moveCaretToEnd"
      @keydown="onKeydown"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  length?: number,
  // a separator is drawn after every `groupSize` digits, 0 draws none
  groupSize?: number,
  invalid?: boolean,
  disabled?: boolean,
  autofocus?: boolean,
  // the code is the main control of the screen or dialog: after a click anywhere, e.g. on a copy button,
  // the focus comes back to it, Tab still moves on to other controls, a code pasted anywhere on the page fills it
  keepFocus?: boolean,
}>(), {
  length: 6,
  groupSize: 0,
  invalid: false,
  disabled: false,
  autofocus: false,
  keepFocus: false,
});

const emit = defineEmits<{
  (e: 'complete', code: string): void,
}>();

const code = defineModel<string>({ default: '' });

const NON_DIGIT_RE = /\D/g;
// controls Tab moves the focus to, keepFocus leaves it there
const FOCUSABLE_CONTROL_SELECTOR = 'a[href], button, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
// another field takes the typing, keepFocus leaves the focus there after a click too
const EDITABLE_SELECTOR = 'input, select, textarea, [contenteditable="true"]';
// the caret stays at the end, so keys which move it inside the code do nothing
const CARET_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
// how the user moved the focus last time, Tab is left alone and a click brings the focus back
let lastInteraction: 'pointer' | 'keyboard' = 'pointer';

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses(
  'afcl-code-input relative inline-flex items-center gap-2',
  props.disabled && 'opacity-50',
  attrs.class as ClassNameValue,
));

const activeIndex = computed(() => isFocused.value ? Math.min(code.value.length, props.length - 1) : -1);

function cellClasses(index: number) {
  const isActive = index === activeIndex.value;
  return [
    'afcl-code-input-cell flex items-center justify-center w-11 h-12 shrink-0 rounded-default border',
    'bg-lightInputBackground text-xl font-medium tabular-nums text-lightInputText shadow-customLight transition-[border-color,box-shadow]',
    'dark:bg-darkInputBackground dark:text-darkInputText',
    props.invalid
      ? 'border-lightDanger dark:border-darkDanger'
      : 'border-lightInputBorder dark:border-darkInputBorder',
    isActive && (props.invalid
      ? 'ring-[3px] ring-lightDanger/20 dark:ring-darkDanger/30'
      : 'border-lightInputFocusBorder ring-[3px] ring-lightInputFocusRing dark:border-darkInputFocusBorder dark:ring-darkInputFocusRing'),
  ];
}

function isGroupEnd(position: number) {
  return props.groupSize > 0 && position % props.groupSize === 0 && position < props.length;
}

function moveCaretToEnd() {
  const input = inputRef.value!;
  input.setSelectionRange(input.value.length, input.value.length);
}

function setCode(raw: string) {
  const digits = raw.replace(NON_DIGIT_RE, '').slice(0, props.length);
  code.value = digits;
  // dropped letters do not change the model, so the field is synced by hand
  inputRef.value!.value = digits;
  moveCaretToEnd();
  if (digits.length === props.length) {
    emit('complete', digits);
  }
}

function focus() {
  inputRef.value?.focus();
}

function clear() {
  code.value = '';
  inputRef.value!.value = '';
  focus();
}

function onKeydown(e: KeyboardEvent) {
  if (CARET_KEYS.includes(e.key)) {
    e.preventDefault();
  }
}

// a pasted code may come with spaces or a dash ("123 456"), so it is cleaned before maxlength cuts it
function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  setCode(e.clipboardData?.getData('text') ?? '');
}

function onFocus() {
  isFocused.value = true;
  moveCaretToEnd();
}

function onBlur(e: FocusEvent) {
  isFocused.value = false;
  const next = e.relatedTarget as Element | null;
  if (!props.keepFocus || next?.matches(EDITABLE_SELECTOR) || (lastInteraction === 'keyboard' && next?.matches(FOCUSABLE_CONTROL_SELECTOR))) {
    return;
  }
  // the clicked button still gets its click, the focus is back before the user types again
  requestAnimationFrame(() => {
    if (inputRef.value?.isConnected && !document.activeElement?.matches(EDITABLE_SELECTOR)) {
      focus();
    }
  });
}

function markPointer() {
  lastInteraction = 'pointer';
}

function markKeyboard() {
  lastInteraction = 'keyboard';
}

function onWindowPaste(e: ClipboardEvent) {
  const target = e.target as Element;
  if (target === inputRef.value || target.closest(EDITABLE_SELECTOR)) {
    return;
  }
  const digits = (e.clipboardData?.getData('text') ?? '').replace(NON_DIGIT_RE, '');
  if (digits.length !== props.length) {
    return;
  }
  e.preventDefault();
  focus();
  setCode(digits);
}

onMounted(async () => {
  if (props.keepFocus) {
    window.addEventListener('paste', onWindowPaste);
    document.addEventListener('pointerdown', markPointer, true);
    document.addEventListener('keydown', markKeyboard, true);
  }
  if (props.autofocus) {
    // a dialog shows its content after this mount and focuses its panel on the next tick
    await nextTick();
    requestAnimationFrame(focus);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', onWindowPaste);
  document.removeEventListener('pointerdown', markPointer, true);
  document.removeEventListener('keydown', markKeyboard, true);
});

defineExpose({ focus, clear });
</script>
