<template>
  <div class="afcl-calendar w-[16.5rem] p-3 text-lightDatePickerCalendarText dark:text-darkDatePickerCalendarMainText">
    <div class="afcl-calendar-header flex items-center justify-between gap-1 mb-2">
      <button type="button" :class="NAV_BUTTON_CLASSES" :aria-label="$t(VIEW_STEPS[view].previousLabel)" @click="turnPage(-1)">
        <IconChevronLeft class="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="afcl-calendar-title h-7 px-2 rounded-md text-sm font-semibold capitalize tabular-nums focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing enabled:hover:bg-lightDatePickerCalendarArrowButtonBackgroundHover dark:enabled:hover:bg-darkDatePickerCalendarArrowButtonBackgroundHover"
        :disabled="view === 'years'"
        @click="view = view === 'days' ? 'months' : 'years'"
      >
        {{ title }}
      </button>
      <button type="button" :class="NAV_BUTTON_CLASSES" :aria-label="$t(VIEW_STEPS[view].nextLabel)" @click="turnPage(1)">
        <IconChevronRight class="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </div>

    <div
      ref="gridEl"
      class="afcl-calendar-grid grid gap-0.5 text-center"
      :class="view === 'days' ? 'grid-cols-7' : MONTHS_GRID_CLASSES"
      @keydown="onGridKeydown"
    >
      <template v-if="view === 'days'">
        <span
          v-for="name in weekdayNames"
          :key="name"
          class="h-6 leading-6 text-[11px] font-medium capitalize text-lightDatePickerCalendarDaysOfWeekText dark:text-darkDatePickerCalendarDaysOfWeekText"
        >{{ name }}</span>
        <span v-for="n in leadingBlanks" :key="`lead-${n}`" class="h-7" aria-hidden="true"></span>
      </template>
      <button
        v-for="cell in cells"
        :key="cell.value"
        type="button"
        :tabindex="cell.value === activeValue ? 0 : -1"
        :aria-label="cell.ariaLabel"
        :aria-pressed="cell.value === selectedValue"
        :aria-current="cell.value === todayValue ? 'date' : undefined"
        :class="[
          'afcl-calendar-cell rounded-md tabular-nums capitalize focus:outline-none focus-visible:relative focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing',
          view === 'days' ? 'h-7 text-[12.5px]' : 'h-full text-sm',
          cell.value === selectedValue
            ? 'font-medium bg-lightDatePickerCalendarDateActiveButtonBackground text-lightDatePickerCalendarDateActiveButtonText dark:bg-darkDatePickerCalendarDateActiveButtonBackground dark:text-darkDatePickerCalendarDateActiveButtonText'
            : 'text-lightDatePickerCalendarDateButtonText hover:bg-lightDatePickerCalendarDateButtonBackgroundHover dark:text-darkDatePickerCalendarDateButtonText dark:hover:bg-darkDatePickerCalendarDateButtonBackgroundHover',
          cell.value === todayValue && cell.value !== selectedValue && 'ring-1 ring-inset ring-lightInputBorder dark:ring-darkInputBorder',
        ]"
        @click="pick(cell.date)"
      >{{ cell.label }}</button>
      <span v-for="n in trailingBlanks" :key="`trail-${n}`" class="h-7" aria-hidden="true"></span>
    </div>

    <div class="afcl-calendar-footer flex justify-between mt-2.5 pt-2.5 border-t border-lightDialogBreakLine dark:border-darkDialogBreakLine">
      <Button type="button" variant="ghost" size="sm" :shadow="false" @click="emit('update:modelValue', null)">{{ $t('Clear') }}</Button>
      <Button type="button" variant="secondary" size="sm" @click="emit('update:modelValue', todayValue)">{{ $t('Today') }}</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import dayjs, { type Dayjs, type ManipulateType } from 'dayjs';
import { IconChevronLeft, IconChevronRight } from '@iconify-prerendered/vue-lucide';
import { PICKER_DAY_FORMAT } from '@/utils/dateUtils';
import { activeElementIn } from './shadowRoot';
import Button from './Button.vue';

type CalendarView = 'days' | 'months' | 'years';

const props = defineProps<{
  // the picked day in PICKER_DAY_FORMAT
  modelValue: string | null,
}>();

const emit = defineEmits<{
  'update:modelValue': [day: string | null],
}>();

const NAV_BUTTON_CLASSES = `flex items-center justify-center w-7 h-7 rounded-md focus:outline-none focus-visible:ring-[3px]
  bg-lightDatePickerCalendarArrowButtonBackground hover:bg-lightDatePickerCalendarArrowButtonBackgroundHover focus-visible:ring-lightFocusRing
  dark:bg-darkDatePickerCalendarArrowButtonBackground dark:hover:bg-darkDatePickerCalendarArrowButtonBackgroundHover dark:focus-visible:ring-darkFocusRing`;

// months and years fill the height of six weeks of days (a row of names, six rows of days, gaps), so the calendar
// does not jump when its view changes
const MONTHS_GRID_CLASSES = 'grid-cols-3 grid-rows-4 h-[12.75rem]';
const YEARS_PER_PAGE = 12;
// six weeks, so the calendar keeps its height while paging through months
const DAY_CELLS = 42;
// Shift+PageUp/PageDown jump by this many pages
const BIG_PAGE = 12;

interface ViewSteps {
  unit: ManipulateType, // what one cell is
  row: number, // cells in a row, the step of ArrowUp and ArrowDown
  pageUnit: ManipulateType, // what the prev and next buttons and PageUp/PageDown turn
  pageSize: number,
  key: string, // format which tells cells of the view apart
  cellLabel: string,
  cellAriaLabel: string,
  previousLabel: string,
  nextLabel: string,
}

const VIEW_STEPS: Record<CalendarView, ViewSteps> = {
  days: {
    unit: 'day', row: 7, pageUnit: 'month', pageSize: 1, key: PICKER_DAY_FORMAT,
    cellLabel: 'D', cellAriaLabel: 'D MMMM YYYY', previousLabel: 'Previous month', nextLabel: 'Next month',
  },
  months: {
    unit: 'month', row: 3, pageUnit: 'year', pageSize: 1, key: 'YYYY-MM',
    cellLabel: 'MMM', cellAriaLabel: 'MMMM YYYY', previousLabel: 'Previous year', nextLabel: 'Next year',
  },
  years: {
    unit: 'year', row: 3, pageUnit: 'year', pageSize: YEARS_PER_PAGE, key: 'YYYY',
    cellLabel: 'YYYY', cellAriaLabel: 'YYYY', previousLabel: 'Previous years', nextLabel: 'Next years',
  },
};

const view = ref<CalendarView>('days');
// the cell which takes keyboard focus, the shown month, year or block of years follows it
const cursor = ref(dayjs(props.modelValue ?? undefined).startOf('day'));
const gridEl = ref<HTMLElement>();

watch(() => props.modelValue, (day) => {
  if (day) {
    cursor.value = dayjs(day);
    view.value = 'days';
  }
});

const todayValue = dayjs().format(PICKER_DAY_FORMAT);
const steps = computed(() => VIEW_STEPS[view.value]);
const activeValue = computed(() => cursor.value.format(steps.value.key));
const selectedValue = computed(() => props.modelValue && dayjs(props.modelValue).format(steps.value.key));
const yearsStart = computed(() => Math.floor(cursor.value.year() / YEARS_PER_PAGE) * YEARS_PER_PAGE);

const title = computed(() => {
  if (view.value === 'days') {
    return cursor.value.format('MMMM YYYY');
  }
  if (view.value === 'months') {
    return cursor.value.format('YYYY');
  }
  return `${yearsStart.value} – ${yearsStart.value + YEARS_PER_PAGE - 1}`;
});

const weekdayNames = computed(() => dayjs.weekdaysMin(true));
const leadingBlanks = computed(() => (cursor.value.startOf('month').day() - dayjs.localeData().firstDayOfWeek() + 7) % 7);
const trailingBlanks = computed(() => view.value === 'days' ? DAY_CELLS - leadingBlanks.value - cursor.value.daysInMonth() : 0);

const cells = computed(() => {
  const firstByView: Record<CalendarView, Dayjs> = {
    days: cursor.value.startOf('month'),
    months: cursor.value.startOf('year'),
    years: cursor.value.year(yearsStart.value).startOf('year'),
  };
  const count = view.value === 'days' ? cursor.value.daysInMonth() : 12;
  const { unit, key, cellLabel, cellAriaLabel } = steps.value;
  return Array.from({ length: count }, (_, i) => {
    const date = firstByView[view.value].add(i, unit);
    return { date, value: date.format(key), label: date.format(cellLabel), ariaLabel: date.format(cellAriaLabel) };
  });
});

function turnPage(direction: number) {
  const { pageUnit, pageSize } = steps.value;
  cursor.value = cursor.value.add(direction * pageSize, pageUnit);
}

function pick(date: Dayjs) {
  if (view.value === 'days') {
    emit('update:modelValue', date.format(PICKER_DAY_FORMAT));
    return;
  }
  cursor.value = view.value === 'months' ? cursor.value.month(date.month()) : cursor.value.year(date.year());
  view.value = view.value === 'months' ? 'days' : 'months';
  // a click keeps the focus in the field, only a keyboard user is already inside the calendar
  if (gridEl.value!.contains(activeElementIn(gridEl.value!))) {
    focus();
  }
}

function onGridKeydown(e: KeyboardEvent) {
  const { unit, row, pageUnit, pageSize } = steps.value;
  const page = (e.shiftKey ? BIG_PAGE : 1) * pageSize;
  const moves: Record<string, () => Dayjs> = {
    ArrowLeft: () => cursor.value.add(-1, unit),
    ArrowRight: () => cursor.value.add(1, unit),
    ArrowUp: () => cursor.value.add(-row, unit),
    ArrowDown: () => cursor.value.add(row, unit),
    PageUp: () => cursor.value.add(-page, pageUnit),
    PageDown: () => cursor.value.add(page, pageUnit),
  };
  if (!moves[e.key]) {
    return;
  }
  e.preventDefault();
  cursor.value = moves[e.key]();
  focus();
}

// moves the keyboard focus to the active cell
async function focus() {
  await nextTick();
  gridEl.value!.querySelector<HTMLButtonElement>('[tabindex="0"]')!.focus();
}

defineExpose({ focus });
</script>
