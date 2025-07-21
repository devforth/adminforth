import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";
import { v1 as uuid } from "uuid";

export default {
  dataSource: "db3",
  table: "users",
  resourceId: "games_users",
  label: "Games users",
  columns: [
    {
      name: "id",
      type: AdminForthDataTypes.STRING, // ✅ Required!
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      showIn: ["list", "filter", "show"],
    },
    {
      name: "email",
      type: AdminForthDataTypes.STRING, // ✅ Required!
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
      type: AdminForthDataTypes.STRING, // ✅ Required!
      enum: [
        { value: "superadmin", label: "Super Admin" },
        { value: "user", label: "User" },
      ],
    },
    {
      name: "password",
      type: AdminForthDataTypes.STRING, // ✅ Required!
      virtual: true,
      required: { create: true },
      editingNote: { edit: "Leave empty to keep password unchanged" },
      minLength: 8,
      showIn: ["create", "edit"],
      masked: true,
    },
  ],
} as AdminForthResourceInput;
