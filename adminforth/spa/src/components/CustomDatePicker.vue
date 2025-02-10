<template>
  <div>
    <div class="grid w-40 gap-4 mb-2">
      <div>
        <label v-if="label" for="start-time" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ label }}</label>

        <div class="relative" :class="{hidden: column.type === 'time'}">
          <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
            <IconCalendar class="w-4 h-4 text-gray-500 dark:text-gray-400"/>
          </div>

          <input ref="datepickerStartEl"  type="text"
                 class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
                :placeholder="$t('Select date')" :disabled="readonly" />
          
        </div>
      </div>
    </div>

    <div>
      <div class="grid w-40 gap-4 mb-2" :class="{hidden: !showTimeInputs}">
        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconTime class="w-4 h-4 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700"/>
            </div>

            <input v-model="startTime" type="time" id="start-time" onfocus="this.showPicker()" onclick="this.showPicker()" step="1"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
                   value="00:00" :disabled="readonly" required/>
          </div>
        </div>
      </div>

      <button type="button"
              class="text-lightPrimary dark:text-darkPrimary text-base font-medium hover:underline p-0 inline-flex items-center mb-2"
              :class="{hidden: column.type !== 'datetime'}"
              @click="toggleTimeInputs">{{ showTimeInputs ? $t('Hide time') : $t('Show time') }}
        <svg class="w-8 h-8 ms-0.5" :class="{'rotate-180': showTimeInputs}" aria-hidden="true"
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
import {ref, computed, onMounted, watch, onBeforeUnmount, nextTick} from 'vue';
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
    // wait ref to initialize
    await nextTick();
    datepickerObject.value.setDate(dayjs(props.valueStart).format('DD MMM YYYY'));
    startTime.value = dayjs(props.valueStart).format('HH:mm:ss')
  }
}

onMounted(() => {
  updateFromProps();

  watch(() => [props.valueStart], (value) => {
    updateFromProps();
  });
})

watch(start, () => {
  //console.log('⚡ emit', start.value)
  emit('update:valueStart', start.value)
})

function initDatepickers() {
  const LS_LANG_KEY = `afLanguage`;
  const options = {format: 'dd M yyyy', language: localStorage.getItem(LS_LANG_KEY)};

  if (props.autoHide) {
    options.autohide = true;
  }

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

onMounted(() => {
  initDatepickers();
});

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