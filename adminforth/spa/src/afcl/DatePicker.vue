<template>
  <div>
    <div class="grid w-40 gap-2 mb-2">
      <div>
        <label v-if="label" for="start-time" class="block mb-2 text-sm font-medium text-lightDatePickerButtonText dark:text-darkDatePickerButtonText">{{ label }}</label>

        <div class="relative" :class="{hidden: column.type === 'time'}">
          <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
            <IconCalendar class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon"/>
          </div>

          <input ref="datepickerStartEl"  type="text"
                 class="af-pick-date-button bg-lightDatePickerButtonBackground border border-lightDatePickerButtonBorder text-lightDatePickerButtonText text-sm rounded-default block w-full px-2.5 py-1.5 leading-5 shadow-customLight focus:outline-none focus:ring-[3px] focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:placeholder-darkInputPlaceholderText dark:text-darkDatePickerButtonText focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder"
                :placeholder="$t('Select date')" :disabled="readonly" />
          
        </div>
      </div>
    </div>

    <div>
      <div class="grid w-40 gap-2 mb-2" :class="{hidden: !showTimeInputs}">
        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconClock class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon bg-lightDatePickerButtonBackground dark:bg-darkDatePickerButtonBackground"/>
            </div>
            <input v-model="startTime" type="time" id="start-time" step="1"
                   class="af-pick-time-button bg-lightDatePickerButtonBackground border border-lightDatePickerButtonBorder text-lightDatePickerButtonText text-sm rounded-default block w-full px-2.5 py-1.5 leading-5 shadow-customLight focus:outline-none focus:ring-[3px] focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder dark:bg-darkInputBackground dark:border-darkInputBorder dark:placeholder-darkInputPlaceholderText dark:text-darkDatePickerButtonText focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder"
                   value="00:00" :disabled="readonly" required/>
          </div>
        </div>
      </div>

      <button type="button"
              class="text-lightDatePickerExpandText dark:text-darkDatePickerExpandText text-[13px] font-medium hover:underline p-0 inline-flex items-center gap-0.5 mb-2"
              :class="{hidden: column.type !== 'datetime'}"
              @click="toggleTimeInputs">{{ showTimeInputs ? $t('Hide time') : $t('Show time') }}
        <IconChevronDown class="w-4 h-4" :class="{'rotate-180': showTimeInputs}"/>
      </button>
    </div>
  </div>
</template>
<script setup>
import {ref, computed, onMounted, watch, onBeforeUnmount} from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {useCoreStore} from '@/stores/core';
import {FLEXIBLE_DATEPICKER_FORMAT} from '@/utils/dateUtils';

import { IconCalendar, IconChevronDown, IconClock } from '@iconify-prerendered/vue-lucide';

const coreStore = useCoreStore();
dayjs.extend(utc)

const props = defineProps({
  valueStart: {
    default: undefined
  },
  column: {
    type: Object,
  },
  label: {
    type: String,
  },
  autoHide: {
    type: Boolean,
  },
  readonly: {
    type: Boolean,
  },
});

const emit = defineEmits(['update:valueStart']);

const datepickerStartEl = ref();

const showTimeInputs = ref(props.column?.type === 'time');

const startDate = ref('');

const startTime = ref('');

const datepickerObject = ref('')

let datepickerReady;

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

async function updateFromProps() {
  if (!props.valueStart) {
    datepickerStartEl.value.value = '';
    startTime.value = '';
  } else if (props.column.type === 'time') {
    startTime.value = props.valueStart;
  } else {
    // datepicker is created only after its lazy-loaded chunk resolves
    await datepickerReady;
    datepickerObject.value.setDate(dayjs(props.valueStart).format('DD MMM YYYY'));
    startTime.value = dayjs(props.valueStart).format('HH:mm:ss')
  }
}

onMounted(() => {
  datepickerReady = initDatepickers();
  updateFromProps();

  watch(() => [props.valueStart], (value) => {
    updateFromProps();
  });
})

watch(start, () => {
  emit('update:valueStart', start.value)
})

async function initDatepickers() {
  const LS_LANG_KEY = `afLanguage`;
  const options = {format: FLEXIBLE_DATEPICKER_FORMAT, language: localStorage.getItem(LS_LANG_KEY)};

  if (props.autoHide) {
    options.autohide = true;
  }

  const { default: Datepicker } = await import(
    'flowbite-datepicker/Datepicker'
  );

  datepickerObject.value = new Datepicker(datepickerStartEl.value, options);

  addChangeDateListener();
}

function addChangeDateListener() {
  datepickerStartEl.value.addEventListener('changeDate', setStartDate)
}

function removeChangeDateListener() {
  datepickerStartEl.value.removeEventListener('changeDate', setStartDate);
}

function destroyDatepickerElement() {
  datepickerObject.value.destroy();
}

function setStartDate(event) {
  startDate.value = event.detail.date
}

function formatTime(time) {
  return time.split(':').map(Number).length === 2 ? time + ':00' : time;
}

function addTimeToDate(time, date) {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return date.hour(hours).minute(minutes).second(seconds)
}

const toggleTimeInputs = () => {
  showTimeInputs.value = !showTimeInputs.value
}

onBeforeUnmount(() => {
  removeChangeDateListener();
  destroyDatepickerElement();
});

function focus() {
  datepickerStartEl.value?.focus();
}

defineExpose({
  focus,
});
</script>

<style lang="css" scoped>

:global(.datepicker-controls button svg),
:global(.datepicker-controls button) {
  @apply text-lightDatePickerCalendarText;
}

:global( .datepicker-dropdown ),
:global( .datepicker-picker ) {
  @apply !bg-lightDatePickerCalendarBackground
}

:global(.datepicker-controls button:hover) {
  @apply bg-lightDatePickerCalendarArrowButtonBackgroundHover;    
}

:global(.datepicker-controls button) {
  @apply ring-lightDatePickerCalendarArrowButtonFocusRing bg-lightDatePickerCalendarArrowButtonBackground;    
}

:global(.datepicker-controls button:focus) {
  @apply ring-lightDatePickerCalendarArrowButtonFocusRing;
}

:global(.days-of-week span) {
  @apply text-lightDatePickerCalendarDaysOfWeekText;
}

:global(.datepicker-grid span) {
  @apply text-lightDatePickerCalendarDateButtonText; 
}

:global(.datepicker-grid span:hover:not(.selected)) {
  @apply bg-lightDatePickerCalendarDateButtonBackgroundHover; 
}

:global(.datepicker-grid .selected ) {
  @apply text-lightDatePickerCalendarDateActiveButtonText bg-lightDatePickerCalendarDateActiveButtonBackground; 
}








:global(.dark .datepicker-controls button svg),
:global(.dark .datepicker-controls button) {
  @apply text-darkDatePickerCalendarMainText;
}

:global(.dark .datepicker-dropdown),
:global(.dark .datepicker-picker) {
  @apply !bg-darkDatePickerCalendarBackground;
}

:global(.dark .datepicker-controls button:hover) {
  @apply bg-darkDatePickerCalendarArrowButtonBackgroundHover;    
}

:global(.dark .datepicker-controls button) {
  @apply ring-darkDatePickerCalendarArrowButtonFocusRing bg-darkDatePickerCalendarArrowButtonBackground;    
}

:global(.dark .datepicker-controls button) {
  @apply ring-darkDatePickerCalendarArrowButtonFocusRing;    
}

:global(.dark .days-of-week span) {
  @apply text-darkDatePickerCalendarDaysOfWeekText;
}

:global(.dark .datepicker-grid span) {
  @apply text-darkDatePickerCalendarDateButtonText; 
}

:global(.dark .datepicker-grid span:hover:not(.selected)) {
  @apply bg-darkDatePickerCalendarDateButtonBackgroundHover; 
}

:global(.dark .datepicker-grid .selected) {
  @apply text-darkDatePickerCalendarDateActiveButtonText 
         bg-darkDatePickerCalendarDateActiveButtonBackground; 
}
</style>
