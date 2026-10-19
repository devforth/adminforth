<template>
  <div class="afcl-time-field relative">
    <input
      ref="inputEl"
      v-model="model"
      type="time"
      :step="step"
      :disabled="disabled"
      class="afcl-time-field-input relative w-full ps-8 pe-2.5"
      :class="[PICKER_TEXT_CLASSES, PICKER_BOX_CLASSES, inputClass]"
    />
    <!-- after the input, which is positioned for the picker indicator and would cover the icon -->
    <IconClock :class="PICKER_ICON_CLASSES" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconClock } from '@iconify-prerendered/vue-lucide';
import { PICKER_BOX_CLASSES, PICKER_ICON_CLASSES, PICKER_TEXT_CLASSES } from './pickerStyles';

defineProps<{
  // 1 shows seconds
  step?: number,
  disabled?: boolean,
  inputClass?: string,
}>();

// "HH:mm" or "HH:mm:ss", empty when no time is set
const model = defineModel<string>({ required: true });

const inputEl = ref<HTMLInputElement>();

defineExpose({
  focus: () => inputEl.value!.focus(),
});
</script>

<style>
/* the clock icon on the left opens the time picker of Chromium: its own indicator lies over the icon, invisible */
.afcl-time-field-input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  width: 2rem;
  height: 100%;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
