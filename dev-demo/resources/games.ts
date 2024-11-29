import { v1 as uuid } from "uuid";
import { AdminForthResourceInput } from "../../adminforth";

export default {
  dataSource: "db2",
  table: "games",
  resourceId: "games",
  label: "Games",
  columns: [
    {
      name: "id",
      required: false,
      label: "Identifier",
      fillOnCreate: ({ initialRecord }: any) => uuid(),
      showIn: ["list", "filter", "show"], // the default is full set
    },
    { name: "name", required: true, isUnique: true },
    {
      name: "created_by",
      required: true,
      enum: [
        { value: "CD Projekt Red", label: "CD Projekt Red" },
        { value: "Rockstar Studios", label: "Rockstar" },
        { value: "Bethesda Game Studios", label: "Bethesda" },
      ],
    },
    {
      name: "release_date",
      fillOnCreate: ({ initialRecord }: any) => new Date().toISOString(),
    },
    { name: "release_date2" },
    { name: "description" },
    { name: "price" },
    { name: "enabled" },
  ],
  options: {
    listPageSize: 10,
  },
} as AdminForthResourceInput;
