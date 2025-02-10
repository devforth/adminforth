import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";
import { v1 as uuid } from "uuid";
import AuditLogPlugin from "../../plugins/adminforth-audit-log";

export default {
  dataSource: "maindb",
  table: "audit_log",
  columns: [
    {
      name: "id",
      primaryKey: true,
      required: false,
      showIn: {
        create: false,
      },
      fillOnCreate: ({ initialRecord }: any) => uuid(),
    },
    { name: "created_at", required: false },
    { name: "resource_id", required: false },
    {
      name: "user_id",
      required: false,
      foreignResource: {
        resourceId: "users",
      },
    },
    { name: "action", required: false },
    { name: "diff", required: false, type: AdminForthDataTypes.JSON },
    { name: "record_id", required: false },
    { name: "ip_address", required: false },
  ],

  options: {
    allowedActions: {
      edit: false,
      delete: false,
      create: false,
    },
  },
  plugins: [
    new AuditLogPlugin({
      resourceColumns: {
        resourceUserIdColumnName: "user_id",
        resourceRecordIdColumnName: "record_id",
        resourceActionColumnName: "action",
        resourceDataColumnName: "diff",
        resourceCreatedColumnName: "created_at",
        resourceIdColumnName: "resource_id",
        resourceIpColumnName: "ip_address",
      },
    }),
  ],
} as AdminForthResourceInput;
