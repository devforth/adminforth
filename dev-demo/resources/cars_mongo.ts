import carsResourseTemplate from "./carsResourseTemplate.js";
import { AdminForthDataTypes } from "adminforth";

export default {...carsResourseTemplate("cars_mongo", "mongo", "_id"), columns: [
      { name: "test_JSON",         type: AdminForthDataTypes.JSON,
    },
    ...carsResourseTemplate("cars_mongo", "mongo", "_id").columns,
  ]};
