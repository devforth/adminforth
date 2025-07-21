import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";
import { v1 as uuid } from "uuid";

export default {
  dataSource: "db2",
  table: "users",
  resourceId: "games_users",
  label: "Games users",
  columns: [
    {
      name: "id",
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      showIn: ["list", "filter", "show"], // the default is full set
    },
    {
      name: "email",
      required: true,
      isUnique: true,
      sortable: false,
    },
    {
      name: "created_at",
      type: AdminForthDataTypes.DATETIME,
      showIn: ["list", "filter", "show"],
      fillOnCreate: ({ initialRecord, adminUser }: any) =>
        new Date().toISOString(),
    },
    {
      name: "role",
      enum: [
        { value: "superadmin", label: "Super Admin" },
        { value: "user", label: "User" },
      ],
    },
    {
      name: "password",
      virtual: true, // field will not be persisted into db
      required: { create: true }, // to show only in create page
      editingNote: { edit: "Leave empty to keep password unchanged" },

      minLength: 8,
      type: AdminForthDataTypes.STRING,
      showIn: ["create", "edit"], // to show in create and edit pages
      masked: true, // to show stars in input field
    },
  ],
} as AdminForthResourceInput;
