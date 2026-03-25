import carsResourseTemplate from "./carsResourseTemplate.js";

const carsResource = carsResourseTemplate("cars_mysql", "mysql", "id");

export default {
  ...carsResource,
  plugins: [
    ...(carsResource.plugins ?? []).filter(plugin => plugin.className !== "ForeignInlineListPlugin"),
  ]
};