<template>
  <div>
    <div class="mx-auto grid grid-cols-2 gap-4 mb-2" :class="{hidden: column.type === 'time'}">
      <div class="relative">
        <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
          <IconCalendar class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon"/>
        </div>

        <input ref="datepickerStartEl" type="text"
               class="bg-lightDatePickerButtonBackground border leading-none border-lightDatePickerButtonBorder text-lightDatePickerButtonText placeholder-lightDatePickerPlaceHolder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:placeholder-darkDatePickerPlaceHolder dark:text-darkDatePickerButtonText dark:focus:ring-blue-500 dark:focus:border-blue-500"
               :placeholder="$t('From')">
      </div>

      <div class="relative">
        <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
          <IconCalendar class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon"/>
        </div>

        <input ref="datepickerEndEl" type="text"
               class="bg-lightDatePickerButtonBackground border leading-none border-lightDatePickerButtonBorder text-lightDatePickerButtonText placeholder-lightDatePickerPlaceHolder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:placeholder-darkDatePickerPlaceHolder dark:text-darkDatePickerButtonText dark:focus:ring-blue-500 dark:focus:border-blue-500"
               :placeholder="$t('To')">
      </div>
    </div>

    <div>
      <div class="mx-auto grid grid-cols-2 gap-4 mb-2" :class="{hidden: !showTimeInputs}">
        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconTime class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon bg-lightDatePickerButtonBackground dark:bg-darkDatePickerButtonBackground"/>
            </div>

            <input v-model="startTime" type="time" id="start-time"
                   class="bg-lightDatePickerButtonBackground border leading-none border-lightDatePickerButtonBorder text-lightDatePickerButtonText placeholder-lightDatePickerPlaceHolder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:placeholder-darkDatePickerPlaceHolder dark:text-darkDatePickerButtonText dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   value="00:00" required/>
          </div>
        </div>

        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconTime class="w-4 h-4 text-lightDatePickerIcon dark:text-darkDatePickerIcon bg-lightDatePickerButtonBackground dark:bg-darkDatePickerButtonBackground"/>
            </div>

            <input v-model="endTime" type="time" id="end-time"
                   class="bg-lightDatePickerButtonBackground border leading-none border-lightDatePickerButtonBorder text-lightDatePickerButtonText placeholder-lightDatePickerPlaceHolder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-darkDatePickerButtonBackground dark:border-darkDatePickerButtonBorder dark:placeholder-darkDatePickerPlaceHolder dark:text-darkDatePickerButtonText dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   value="00:00" required/>
          </div>
        </div>
      </div>

      <button type="button"
              class="text-lightPrimary dark:text-darkPrimary text-base font-medium hover:underline p-0 inline-flex items-center mb-2"
              :class="{hidden: column.type !== 'datetime'}"
              @click="toggleTimeInputs">{{ showTimeInputs ? $t('Hide time') : $t('Show time') }}
        <svg class="w-8 h-8 ms-0.5 relative top-px" :class="{'rotate-180': showTimeInputs}" aria-hidden="true"
             xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="m8 10 4 4 4-4"/>
        </svg>
      </button>
    </div>
  </div>
</template>
<script setup>
import {ref, computed, onMounted, watch, onBeforeUnmount} from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {useCoreStore} from '@/stores/core';

import Datepicker from "flowbite-datepicker/Datepicker";
import IconCalendar from "@/components/icons/IconCalendar.vue";
import IconTime from "@/components/icons/IconTime.vue";

const coreStore = useCoreStore();
dayjs.extend(utc)

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

const datepickerStartEl = ref();
const datepickerEndEl = ref();

const showTimeInputs = ref(props.column?.type === 'time');

const startDate = ref('');
const endDate = ref('');

const startTime = ref('');
const endTime = ref('');

const datepickerStartObject = ref('')
const datepickerEndObject = ref('')

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

  if (endTime.value) {
    date = addTimeToDate(formatTime(endTime.value), date)
  } else {
    date = addTimeToDate('23:59:59', date)
  }

  return date.utc().toISOString();
})

function updateFromProps() {
  if (!props.valueStart) {
    datepickerStartEl.value.value = '';
    startTime.value = '';
  } else if (props.column.type === 'time') {
    startTime.value = props.valueStart;
  } else {
    const date = dayjs(props.valueStart);
    datepickerStartEl.value.value = date.format('DD MMM YYYY');
    if (date.format('HH:mm') !== '00:00') {
      startTime.value = date.format('HH:mm');
      showTimeInputs.value = true;
    } else {
      startTime.value = '';
    }
    startDate.value = date.toString();
  }

  if (!props.valueEnd) {
    datepickerEndEl.value.value = '';
    endTime.value = '';
    endDate.value = '';
  } else if (props.column.type === 'time') {
    endTime.value = props.valueEnd;
  } else {
    const date = dayjs(props.valueEnd);
    datepickerEndEl.value.value = date.format('DD MMM YYYY');
    if (date.format('HH:mm') !== '00:00') {
      endTime.value = date.format('HH:mm');
      showTimeInputs.value = true;
    } else {
      endTime.value = '';
    }
    endDate.value = date.toString();
  }
}

onMounted(() => {
  updateFromProps();

  watch(() => [props.valueStart, props.valueEnd], (value) => {
    updateFromProps();
  });
})

watch(start, () => {
  emit('update:valueStart', start.value)
})

watch(end, () => {
  emit('update:valueEnd', end.value)
})

function initDatepickers() {
  const LS_LANG_KEY = `afLanguage`;
  datepickerStartObject.value = new Datepicker(datepickerStartEl.value, {format: 'dd M yyyy', language: localStorage.getItem(LS_LANG_KEY)});
  datepickerEndObject.value = new Datepicker(datepickerEndEl.value, {format: 'dd M yyyy', language: localStorage.getItem(LS_LANG_KEY)});
  addChangeDateListener();
}

function addChangeDateListener() {
  datepickerStartEl.value.addEventListener('changeDate', setStartDate)
  datepickerEndEl.value.addEventListener('changeDate', setEndDate)
}

function removeChangeDateListener() {
  datepickerStartEl.value.removeEventListener('changeDate', setStartDate);
  datepickerEndEl.value.removeEventListener('changeDate', setEndDate);
}

function destroyDatepickerElement() {
  datepickerStartObject.value.destroy();
  datepickerEndObject.value.destroy();
}

function setStartDate(event) {
  startDate.value = event.detail.date
}

function setEndDate(event) {
  endDate.value = event.detail.date
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

onMounted(() => {
  initDatepickers();
});

onBeforeUnmount(() => {
  removeChangeDateListener();
  destroyDatepickerElement();
})
</script>