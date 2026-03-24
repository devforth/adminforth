import { AdminUser } from "../../../adminforth/index.js";
import carsResourseTemplate from "../../../dev-demo/resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_create_by_hook", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_create_by_hook", "sqlite", "id").options,
  },
  hooks: {
    create: {
      beforeSave: async () => {
        console.log('beforeSave hook called');
        return { ok: false }
      }
    }
  }
};