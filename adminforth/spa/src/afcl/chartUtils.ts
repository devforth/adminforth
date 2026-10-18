// categorical slots in fixed order, the first five are the chart palette drawn in design/system.html
export const CHART_COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948",
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC949", "#B07AA1", "#FF9DA6", "#9C755F", "#BAB0AC",
  "#2B8A86", "#CC4D58", "#F7941D", "#F9C232", "#729B33", "#497288", "#16578D", "#5F4D99", "#F9F871", "#F9F871",
];

// merges ApexCharts options on the lowest level ({ chart: { height } } keeps the rest of chart),
// every touched level is copied so the shared base options of a component are never mutated
export function mergeChartOptions(options: any, overrides: any) {
  for (const key in overrides) {
    if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
      options[key] = { ...options[key] };
      mergeChartOptions(options[key], overrides[key]);
    } else {
      options[key] = overrides[key];
    }
  }
}
