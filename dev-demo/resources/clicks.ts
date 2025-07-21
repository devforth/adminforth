import { v1 as uuid } from "uuid";
import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";

export default {
  dataSource: "ch",
  table: "clicks",
  /*
    SQL to create table run SQL in http://localhost:8123/play
    CREATE TABLE demo.clicks (
      clickid UUID PRIMARY KEY,
      element String,
      clientX Int32,
      created_at DateTime,
      aggressiveness Float32,
      click_price Decimal(10, 2)

    )

    */
  columns: [
  {
    name: "clickid",
    primaryKey: true,
    required: false,
    fillOnCreate: ({ initialRecord }: any) => uuid(),
    showIn: {
      create: false,
      list: true,
      filter: true,
      show: true
    },
    components: {
      list: "@/renderers/CompactUUID.vue",
    },
  },

    {
      name: "element",
      type: AdminForthDataTypes.STRING,
      required: false,
      enum: [
        { value: "button", label: "Button" },
        { value: "link", label: "Link" },
        { value: "image", label: "Image" },
      ],
    },
    {
      name: "clientX",
      type: AdminForthDataTypes.INTEGER,
      allowMinMaxQuery: true,
      required: false,
    },
    { name: "created_at", type: AdminForthDataTypes.DATETIME, required: false },
    {
      name: "aggressiveness",
      allowMinMaxQuery: true,
      type: AdminForthDataTypes.FLOAT,
      required: false,
      showIn: ["filter", "show", "edit"],
    },
    {
      name: "click_price",
    },
  ],
} as AdminForthResourceInput;
