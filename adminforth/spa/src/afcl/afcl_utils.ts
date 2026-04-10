export let ApexChartsPromise: Promise<any> | null = null;
export let DatePickerPromise: Promise<any> | null = null;

export function loadApexCharts() {
  if (!ApexChartsPromise) {
    ApexChartsPromise = import('apexcharts').then(m => m.default);
  }
  return ApexChartsPromise;
}

export function loadDatePicker() {
  if (!DatePickerPromise) {
    DatePickerPromise = import('flowbite-datepicker/Datepicker').then(m => m.default);
  }
  return DatePickerPromise;
}

