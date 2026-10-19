<template>
  <div ref="rootEl" class="afcl-date-field relative" :style="{ anchorName }">
    <IconCalendar v-if="!bare" :class="PICKER_ICON_CLASSES" aria-hidden="true" />
    <input
      ref="inputEl"
      v-model="text"
      :id="inputId"
      type="text"
      autocomplete="off"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full',
        PICKER_TEXT_CLASSES,
        bare ? 'h-full px-2.5 bg-transparent border-0' : ['ps-8 pe-2.5', PICKER_BOX_CLASSES, isOpen && PICKER_BOX_OPEN_CLASSES],
        inputClass,
      ]"
      @focus="onFocus"
      @click="open"
      @input="onInput"
      @keydown="onInputKeydown"
      @blur="commit"
    />
    <teleport :to="teleportTarget" v-if="isOpen">
      <!-- mousedown keeps the focus in the field, so a click on a day does not blur it and typing goes on -->
      <div
        ref="popoverEl"
        popover="manual"
        role="dialog"
        :style="{ positionAnchor: anchorName }"
        class="afcl-date-field-popover p-0 rounded-lg bg-lightDatePickerCalendarBackground shadow-popover dark:bg-darkDatePickerCalendarBackground dark:shadow-darkPopover"
        @mousedown.prevent
        @keydown="onPopoverKeydown"
      >
        <Calendar ref="calendarRef" :modelValue="previewDay" @update:modelValue="select" />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconCalendar } from '@iconify-prerendered/vue-lucide';
import { formatPickerDay, parseFlexibleDate } from '@/utils/dateUtils';
import { activeElementIn, useTeleportTarget } from './shadowRoot';
import Calendar from './Calendar.vue';
import { PICKER_BOX_CLASSES, PICKER_BOX_OPEN_CLASSES, PICKER_ICON_CLASSES, PICKER_TEXT_CLASSES } from './pickerStyles';

const props = defineProps<{
  // the picked day in PICKER_DAY_FORMAT
  modelValue: string | null,
  placeholder?: string,
  disabled?: boolean,
  // closes the calendar once a day is picked
  autoHide?: boolean,
  // no border, icon and background: the field sits inside a box of the parent, like the two halves of a range
  bare?: boolean,
  inputId?: string,
  inputClass?: string,
}>();

const emit = defineEmits<{
  'update:modelValue': [day: string | null],
}>();

const OFFSET = 6;
const SUPPORTS_ANCHOR = CSS.supports('anchor-name: --a');

const { locale } = useI18n();
const teleportTarget = useTeleportTarget();
const anchorName = `--afcl-date-field-${useId()}`;

const rootEl = ref<HTMLElement>();
const inputEl = ref<HTMLInputElement>();
const popoverEl = ref<HTMLElement>();
const calendarRef = ref<InstanceType<typeof Calendar>>();

const isOpen = ref(false);
const text = ref('');
// the day the calendar shows while the user types, it becomes the value on Enter or blur
const previewDay = ref<string | null>(null);
// focus which the field takes back from its own calendar must not open it again
let skipFocusOpen = false;

function showValue() {
  text.value = props.modelValue ? formatPickerDay(props.modelValue) : '';
  previewDay.value = props.modelValue;
}

watch(() => props.modelValue, showValue, { immediate: true });
// month names follow the language
watch(locale, showValue);

function open() {
  if (!props.disabled) {
    isOpen.value = true;
  }
}

function close() {
  isOpen.value = false;
}

function onFocus() {
  if (skipFocusOpen) {
    skipFocusOpen = false;
    return;
  }
  open();
}

function focusField() {
  skipFocusOpen = true;
  inputEl.value!.focus();
}

function onInput() {
  open();
  const typed = text.value.trim();
  previewDay.value = typed ? parseFlexibleDate(typed) ?? previewDay.value : null;
}

function commit() {
  const typed = text.value.trim();
  const day = typed ? parseFlexibleDate(typed) : null;
  if (typed && !day) {
    // not a date: the field returns to the value it had
    showValue();
    return;
  }
  text.value = day ? formatPickerDay(day) : '';
  previewDay.value = day;
  if (day !== props.modelValue) {
    emit('update:modelValue', day);
  }
}

function select(day: string | null) {
  const focusInCalendar = popoverEl.value!.contains(activeElementIn(popoverEl.value!));
  text.value = day ? formatPickerDay(day) : '';
  previewDay.value = day;
  if (day !== props.modelValue) {
    emit('update:modelValue', day);
  }
  if (props.autoHide) {
    close();
    if (focusInCalendar) {
      focusField();
    }
  }
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    open();
    nextTick(() => calendarRef.value!.focus());
  } else if (e.key === 'Escape' && isOpen.value) {
    // only the calendar closes, not a dialog or drawer around the field
    e.stopPropagation();
    close();
  } else if (e.key === 'Enter' && isOpen.value) {
    e.preventDefault();
    commit();
    if (props.autoHide) {
      close();
    }
  } else if (e.key === 'Tab') {
    close();
  }
}

function onPopoverKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
    focusField();
  } else if (e.key === 'Tab') {
    // the calendar is teleported to the end of the page, Tab cycles inside it like in a dialog
    const focusable = [...popoverEl.value!.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"])')];
    const current = focusable.indexOf(activeElementIn(popoverEl.value!) as HTMLElement);
    e.preventDefault();
    focusable[(current + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
  }
}

function onDocumentMousedown(e: MouseEvent) {
  // inside a shadow root e.target is the host, composedPath() starts at the clicked element
  const target = e.composedPath()[0] as Node;
  if (!rootEl.value!.contains(target) && !popoverEl.value?.contains(target)) {
    close();
  }
}

// Safari before 26 and Firefox before 147 have no CSS anchor positioning
function placeByRect() {
  const field = rootEl.value!.getBoundingClientRect();
  const el = popoverEl.value!;
  const { width, height } = el.getBoundingClientRect();
  const fitsBelow = field.bottom + OFFSET + height <= window.innerHeight;
  el.style.top = `${fitsBelow ? field.bottom + OFFSET : field.top - OFFSET - height}px`;
  el.style.left = `${Math.min(Math.max(field.left, 0), window.innerWidth - width)}px`;
}

function addListeners() {
  document.addEventListener('mousedown', onDocumentMousedown);
  if (!SUPPORTS_ANCHOR) {
    window.addEventListener('scroll', placeByRect, true);
    window.addEventListener('resize', placeByRect);
  }
}

function removeListeners() {
  document.removeEventListener('mousedown', onDocumentMousedown);
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
  if (!SUPPORTS_ANCHOR) {
    placeByRect();
  }
  addListeners();
});

onBeforeUnmount(removeListeners);

defineExpose({
  focus: () => inputEl.value!.focus(),
});
</script>

<style>
/* popover puts the calendar into the top layer, so no z-index and no clipping by overflow of the parents */
.afcl-date-field-popover {
  inset: auto;
  margin: 0;
  overflow: visible;
}

@supports (anchor-name: --a) {
  .afcl-date-field-popover {
    position-area: bottom span-right;
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
    margin-top: 6px;
  }
}
</style>
