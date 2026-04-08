import { type ApexOptions } from 'apexcharts';

export let ApexChartsPromise: Promise<any> | null = null;

export function loadApexCharts() {
  if (!ApexChartsPromise) {
    ApexChartsPromise = import('apexcharts').then(m => m.default);
  }
  return ApexChartsPromise;
}
