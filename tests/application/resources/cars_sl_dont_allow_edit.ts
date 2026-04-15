import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_edit", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_edit", "sqlite", "id").options,
    allowedActions: {
      edit: false
    }
  }
};