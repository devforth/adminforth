<template>
  <div class="afcl-datepicker" :class="{ 'opacity-50': readonly }">
    <label v-if="label" :for="dateInputId" class="block mb-2 text-sm font-medium text-lightDatePickerButtonText dark:text-darkDatePickerButtonText">{{ label }}</label>
    <div class="flex flex-wrap gap-1.5">
      <DateField
        v-if="fieldsType !== 'time'"
        ref="dateField"
        v-model="date"
        class="w-40"
        inputClass="af-pick-date-button"
        :inputId="dateInputId"
        :placeholder="$t('Select date')"
        :disabled="readonly"
        :autoHide="autoHide"
      />
      <TimeField
        v-if="fieldsType !== 'date'"
        ref="timeField"
        v-model="time"
        class="w-36"
        inputClass="af-pick-time-button"
        :step="1"
        :disabled="readonly"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, useId, getCurrentInstance } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';

import { PICKER_DAY_FORMAT } from '@/utils/dateUtils';
import DateField from './DateField.vue';
import TimeField from './TimeField.vue';

type DatePickerType = 'date' | 'datetime' | 'time';

const props = withDefaults(defineProps<{
  // date, time, or both side by side
  type?: DatePickerType,
  label?: string,
  // closes the calendar once a day is picked
  autoHide?: boolean,
  readonly?: boolean,
  /** @deprecated use `type`, removed in the next major version */
  column?: { type: DatePickerType },
  /** @deprecated use `v-model`, removed in the next major version */
  valueStart?: string,
}>(), {
  type: 'date',
});

const emit = defineEmits<{
  /** @deprecated use `v-model`, removed in the next major version */
  'update:valueStart': [value: string | undefined],
}>();

// "2026-10-14" for date, an ISO string in UTC for datetime, "14:20:00" for time
const model = defineModel<string>();

// TODO next major: remove column and valueStart with their warnings
// the props and listeners the parent passed, to tell v-model:valueStart from v-model
const parentProps = getCurrentInstance()!.vnode.props ?? {};
const usesValueStart = ['valueStart', 'value-start', 'onUpdate:valueStart'].some((key) => key in parentProps);
if (props.column) {
  console.warn('AFCL DatePicker: the "column" prop is deprecated and will be removed in the next major version, pass type="date|datetime|time" instead');
}
if (usesValueStart) {
  console.warn('AFCL DatePicker: "valueStart" is deprecated and will be removed in the next major version, use v-model instead');
}

const fieldsType = computed(() => props.column?.type ?? props.type);
const current = computed(() => usesValueStart ? props.valueStart : model.value);

function setValue(value: string | undefined) {
  if (usesValueStart) {
    emit('update:valueStart', value);
  } else {
    model.value = value;
  }
}

const dateField = ref<InstanceType<typeof DateField>>();
const timeField = ref<InstanceType<typeof TimeField>>();
const dateInputId = useId();

const date = ref<string | null>(null);

const time = ref('');

const value = computed(() => {
  if (fieldsType.value === 'time') {
    return formatTime(time.value);
  }

  if (!date.value) {
    return;
  }

  let value = dayjs(date.value);

  if (fieldsType.value === 'date') {
    return value.format('YYYY-MM-DD');
  }

  if (time.value) {
    value = addTimeToDate(formatTime(time.value), value)
  }

  return value.utc().toISOString();
})

function updateFromModel() {
  if (!current.value) {
    date.value = null;
    time.value = '';
  } else if (fieldsType.value === 'time') {
    time.value = current.value;
  } else {
    const value = dayjs(current.value);
    date.value = value.format(PICKER_DAY_FORMAT);
    time.value = value.format('HH:mm:ss');
  }
}

watch(current, updateFromModel, { immediate: true });

watch(value, () => {
  setValue(value.value);
})

function formatTime(time: string) {
  return time.split(':').map(Number).length === 2 ? time + ':00' : time;
}

function addTimeToDate(time: string, date: Dayjs) {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return date.hour(hours).minute(minutes).second(seconds)
}

function focus() {
  (fieldsType.value === 'time' ? timeField : dateField).value!.focus();
}

defineExpose({
  focus,
});
</script>
