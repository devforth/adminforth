import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_delete", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_delete", "sqlite", "id").options,
    allowedActions: {
      delete: false,
    }
  }
};