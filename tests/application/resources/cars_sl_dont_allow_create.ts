import carsResourseTemplate from "../../../dev-demo/resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_create", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_create", "sqlite", "id").options,
    allowedActions: {
      create: false
    }
  }
};