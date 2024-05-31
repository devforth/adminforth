<template>
  <div>
    <div class="mx-auto grid grid-cols-2 gap-4 mb-2">
      <div>
        <label for="start-time" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start date:</label>

        <div class="relative">
          <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5">
            <IconCalendar class="w-4 h-4 text-gray-500 dark:text-gray-400"/>
          </div>

          <input id="datepicker-start" type="text"
                 class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                 placeholder="Start date">
        </div>
      </div>

      <div>
        <label for="start-time" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End date:</label>

        <div class="relative">
          <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5">
            <IconCalendar class="w-4 h-4 text-gray-500 dark:text-gray-400"/>
          </div>

          <input id="datepicker-end" type="text"
                 class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                 placeholder="End date">
        </div>
      </div>
    </div>

    <div>
      <div class="mx-auto grid grid-cols-2 gap-4 mb-2" :class="{hidden: !showTimeInputs}">
        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconTime class="w-4 h-4 text-gray-500 dark:text-gray-400 bg-white"/>
            </div>

            <input v-model="startTime" type="time" id="start-time"
                   class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   min="09:00" max="18:00" value="00:00" required/>
          </div>
        </div>

        <div>
          <div class="relative">
            <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
              <IconTime class="w-4 h-4 text-gray-500 dark:text-gray-400 bg-white"/>
            </div>

            <input v-model="endTime" type="time" id="end-time"
                   class="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   min="09:00" max="18:00" value="00:00" required/>
          </div>
        </div>
      </div>

      <button type="button"
              class="text-blue-700 dark:text-blue-500 text-base font-medium hover:underline p-0 inline-flex items-center mb-2"
              @click="toggleTimeInputs">{{ showTimeInputs ? 'Hide time' : 'Show time' }}
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {useCoreStore} from '@/stores/core';

import Datepicker from "flowbite-datepicker/Datepicker";
import IconCalendar from "@/components/icons/IconCalendar.vue";
import IconTime from "@/components/icons/IconTime.vue";

const coreStore = useCoreStore();
dayjs.extend(utc)

const props = defineProps({
  modelValue: {
    default: undefined,
  },
  column: {
    type: Object,
  },
});

const emit = defineEmits(['update']);

onMounted(() => {
  const datepickerStartEl = document.getElementById('datepicker-start');
  datepickerStartEl.addEventListener('changeDate', setStartDate)
  new Datepicker(datepickerStartEl, {});


  const datepickerEndEl = document.getElementById('datepicker-end');
  datepickerEndEl.addEventListener('changeDate', setEndDate)
  new Datepicker(datepickerEndEl, {});
});

const showTimeInputs = ref(false);

const startDate = ref(undefined);
const endDate = ref(undefined);

const startTime = ref('');
const endTime = ref('');

const start = computed(() => {
  if (!startDate.value) {
    return;
  }
  let date = dayjs(startDate.value);

  if (startTime.value) {
    console.log(startTime.value);
    date = addTimeToDate(startTime.value, date)
  }

  return date.utc().toISOString();
})

const end = computed(() => {
  if (!endDate.value) {
    return;
  }
  let date = dayjs(endDate.value);

  if (endTime.value) {
    console.log(endTime.value);
    date = addTimeToDate(endTime.value, date)
  }else {
    date = addTimeToDate('23:59:59', date )
  }

  return date.utc().toISOString();
})

watch(start, () => {
  console.log('start', start.value)
  emit('update', {column: props.column, value: start.value, operator: 'gte'})
})

watch(end, () => {
  console.log('end', end.value)
  emit('update', {column: props.column, value: end.value, operator: 'lte'})
})

watch(startDate, () => {
  console.log('startDate', startDate.value)
})

watch(endDate, () => {
  console.log('endDate', endDate.value)
})

watch(startTime, () => {
  console.log('startTime', startTime.value)
})

watch(endTime, () => {
  console.log('endTime', endTime.value)
})

function setStartDate(event) {
  startDate.value = event.detail.date
}

function setEndDate(event) {
  endDate.value = event.detail.date
}

function addTimeToDate(time, date) {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return date.hour(hours).minute(minutes).second(seconds)
}

const toggleTimeInputs = () => {
  showTimeInputs.value = !showTimeInputs.value
}
</script>