import { before } from "node:test";
import { AdminUser } from "../../../adminforth/index.js";
import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";


export default {
  ...carsResourseTemplate("cars_sl_no_delete_by_hook", "sqlite", "id"), 
  options: {
    ...carsResourseTemplate("cars_sl_no_delete_by_hook", "sqlite", "id").options,
  },
  hooks: {
    delete: {
      beforeSave: async () => {
        return { ok: false }
      }
    }
  }
};