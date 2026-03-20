import carsResourseTemplate from "../../../dev-demo/resources/carsResourseTemplate.js";

const cars_sl = carsResourseTemplate("cars_sl", "sqlite", "id");

export default {
  ...cars_sl,
  columns: [
    ...cars_sl.columns.filter(c => c.name !== "mileage"),
    {
      name: "mileage",
      type: "number",
      required: true,
    },
  ],
};