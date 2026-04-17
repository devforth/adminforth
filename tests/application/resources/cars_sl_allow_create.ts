import carsResourseTemplate from "../../../dev-demo/resources/cars_resources/carsResourseTemplate.js";
import { AdminForthDataTypes } from 'adminforth'

const cars_sl = carsResourseTemplate("cars_sl", "sqlite", "id");

export default {
  ...cars_sl,
  columns: [
    ...cars_sl.columns.filter(c => c.name !== "mileage" && c.name !== "photos" && c.name !== "generated_promo_picture"),
    {
      name: "mileage",
      type: "number",
      required: true,
    },
    {
      name: 'photos',
      type: AdminForthDataTypes.JSON,
      label: 'Photos',
      isArray: {
        enabled: true,
        itemType: AdminForthDataTypes.STRING,
      },
      showIn: { 
        list: false,
        create: false,
        edit: false,
      },
    },
    {
      name: 'generated_promo_picture',
      type: AdminForthDataTypes.STRING,
      label: 'Generated Promo Picture',
      editReadonly: true,
    },
  ],
};