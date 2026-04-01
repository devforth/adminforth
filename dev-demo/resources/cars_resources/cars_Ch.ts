import carsResourseTemplate from "./carsResourseTemplate.js";

const carsResource = carsResourseTemplate("cars_ch", "clickhouse", "id");

export default {
  ...carsResource,
  columns: [
    ...carsResource.columns.filter(col => col.name !== "photos"),
  ],
  plugins: [
    ...(carsResource.plugins ?? []).filter(plugin => plugin.pluginOptions?.pathColumnName !== "photos" && plugin.className !== "ForeignInlineListPlugin"),
  ]
};