import { AdminForthResourceInput } from "adminforth";

// one-to-one extra data of a car: the primary key is also the foreign key to the car
export default {
  dataSource: "sqlite",
  table: "car_meta",
  resourceId: "car_meta",
  label: "Car meta",
  columns: [
    {
      name: "car_id",
      primaryKey: true,
      foreignResource: {
        resourceId: "cars_sl",
      },
    },
    { name: "note" },
  ],
} as AdminForthResourceInput;
