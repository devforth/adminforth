import carsResourseTemplate from "./carsResourseTemplate.js";
import { AdminForthDataTypes } from "adminforth";

const carsResource = carsResourseTemplate("cars_mongo", "mongo", "_id");

export default {
  ...carsResource, 
  columns: [
    { 
      name: "test_JSON", type: AdminForthDataTypes.JSON,
    },
    ...carsResource.columns,
  ],
  plugins: [
    ...(carsResource.plugins ?? []).filter(plugin => plugin.className !== "ForeignInlineListPlugin"),
  ]
};
