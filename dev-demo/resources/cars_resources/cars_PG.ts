import carsResourseTemplate from "./carsResourseTemplate.js";

const carsResource = carsResourseTemplate("cars_pg", "postgres", "id");

export default {
  ...carsResource,
  plugins: [
    ...(carsResource.plugins ?? []).filter(plugin => plugin.className !== "ForeignInlineListPlugin"),
  ]
};