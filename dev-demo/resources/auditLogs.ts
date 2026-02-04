
import AuditLogPlugin from "../../plugins/adminforth-audit-log/index.js";
import { AdminForthDataTypes } from "../../adminforth/index.js";
import { randomUUID } from "crypto";

export default {
  dataSource: 'sqlite', 
  table: 'audit_logs',
  columns: [
    { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => randomUUID(),
      showIn: {
        list: false,
        edit: false,
        create: false,
        filter: false,
      } },
    { name: 'created_at', required: false },
    { name: 'resource_id', required: false },
    { name: 'user_id', required: false, 
        foreignResource: {
        resourceId: 'adminuser',
      } },
    { name: 'action', required: false },
    { name: 'diff', required: false, type: AdminForthDataTypes.JSON, showIn: {
        list: false,
        edit: false,
        create: false,
        filter: false,
      } },
    { name: 'record_id', required: false },
    { name: 'ip_address', required: false },
  ],
  options: {
    allowedActions: {
      edit: false,
      delete: false,
      create: false
    }
  },
  plugins: [
    new AuditLogPlugin({
      id: 'AuditLogPlugin',
      // if you want to exclude some resources from logging
      //excludeResourceIds: ['adminuser'],
      resourceColumns: {
        resourceIdColumnName: 'resource_id',
        resourceActionColumnName: 'action',
        resourceDataColumnName: 'diff',
        resourceUserIdColumnName: 'user_id',
        resourceRecordIdColumnName: 'record_id',
        resourceCreatedColumnName: 'created_at',
        resourceIpColumnName: "ip_address",
      }
    }),
  ],
}