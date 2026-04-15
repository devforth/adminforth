import { AdminUser } from "../../../adminforth/index.js";
import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_show_by_hook", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_show_by_hook", "sqlite", "id").options,
  },
  hooks: {
    show: {
      beforeDatasourceRequest: async () => {
        console.log("beforeDatasourceRequest for show")
        return { ok: false }
      }
    }
  }
};