<template>
  <div class="af-date-range-picker flex flex-col gap-2">
    <div v-if="column.type !== 'time'" class="flex items-center" :class="PICKER_BOX_CLASSES">
      <DateField v-model="startDate" bare class="flex-1 min-w-0 h-full" :placeholder="$t('From')" />
      <IconArrowRight class="w-3.5 h-3.5 shrink-0 text-lightDatePickerIcon dark:text-darkDatePickerIcon rtl:rotate-180" aria-hidden="true" />
      <DateField v-model="endDate" bare class="flex-1 min-w-0 h-full" :placeholder="$t('To')" />
    </div>

    <div v-if="showTimeInputs" class="grid grid-cols-2 gap-2">
      <TimeField v-model="startTime" />
      <TimeField v-model="endTime" />
    </div>

    <button type="button"
            v-if="column.type === 'datetime'"
            class="self-start inline-flex items-center gap-0.5 p-0 rounded-sm text-[13px] font-medium hover:underline focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing text-lightDatePickerExpandText dark:text-darkDatePickerExpandText"
            @click="showTimeInputs = !showTimeInputs">{{ showTimeInputs ? $t('Hide time') : $t('Show time') }}
      <IconChevronDown class="w-4 h-4" :class="{'rotate-180': showTimeInputs}" aria-hidden="true"/>
    </button>
  </div>
</template>
<script setup>
import {ref, computed, watch} from 'vue';
import dayjs from 'dayjs';

import {PICKER_DAY_FORMAT} from '@/utils';
import DateField from '@/afcl/DateField.vue';
import TimeField from '@/afcl/TimeField.vue';
import {PICKER_BOX_CLASSES} from '@/afcl/pickerStyles';

import { IconArrowRight, IconChevronDown } from '@iconify-prerendered/vue-lucide';

const props = defineProps({
  valueStart: {
    default: undefined
  },
  valueEnd: {
    default: undefined
  },
  column: {
    type: Object,
  },
});

const emit = defineEmits(['update:valueStart', 'update:valueEnd']);

// a range from the start of a day to its end needs no time, the time fields stay hidden for it
const DAY_START = '00:00:00';
const DAY_END = '23:59:59';

const showTimeInputs = ref(props.column?.type === 'time');

const startDate = ref(null);
const endDate = ref(null);

const startTime = ref('');
const endTime = ref('');

const start = computed(() => {
  if (props.column?.type === 'time') {
    return formatTime(startTime.value);
  }

  if (!startDate.value) {
    return;
  }

  let date = dayjs(startDate.value);

  if (props.column?.type === 'date') {
    return date.format('YYYY-MM-DD');
  }

  if (startTime.value) {
    date = addTimeToDate(formatTime(startTime.value), date)
  }

  return date.utc().toISOString();
})

const end = computed(() => {
  if (props.column?.type === 'time') {
    return formatTime(endTime.value);
  }

  if (!endDate.value) {
    return;
  }

  let date = dayjs(endDate.value);

  if (props.column?.type === 'date') {
    return date.format('YYYY-MM-DD');
  }

  date = addTimeToDate(endTime.value ? formatTime(endTime.value) : DAY_END, date);

  return date.utc().toISOString();
})

// the time of a datetime bound for the time field, empty when the bound is the start or the end of its day
function boundTime(date, dayEdge) {
  return props.column.type === 'datetime' && date.format('HH:mm:ss') !== dayEdge ? date.format('HH:mm') : '';
}

// shows a bound of the range from its prop. Each bound follows only its own prop: the other one may still wait
// in the debounce of the filters, resetting it here would drop it
function showBound(value, dayEdge, date, time) {
  if (!value) {
    date.value = null;
    time.value = '';
  } else if (props.column.type === 'time') {
    time.value = value;
  } else {
    const parsed = dayjs(value);
    date.value = parsed.format(PICKER_DAY_FORMAT);
    time.value = boundTime(parsed, dayEdge);
  }
  if (time.value) {
    showTimeInputs.value = true;
  }
}

watch(() => props.valueStart, (value) => showBound(value, DAY_START, startDate, startTime), { immediate: true });
watch(() => props.valueEnd, (value) => showBound(value, DAY_END, endDate, endTime), { immediate: true });

watch(start, () => {
  emit('update:valueStart', start.value)
})

watch(end, () => {
  emit('update:valueEnd', end.value)
})

function formatTime(time) {
  return time.split(':').map(Number).length === 2 ? time + ':00' : time;
}

function addTimeToDate(time, date) {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return date.hour(hours).minute(minutes).second(seconds)
}
</script>
