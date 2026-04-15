import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_show", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_show", "sqlite", "id").options,
    allowedActions: {
      show: false,
      list: false
    }
  }
};